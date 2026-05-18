import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { AuthRepository } from './auth.repository.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { requirePermission } from '../../hooks/require-permission.js'
import {
    loginSchema,
    updateMeSchema,
    authResponseSchema,
    meResponseSchema,
    errorSchema,
    type LoginInput,
    type UpdateMeInput
} from './auth.schema.js'
import { env } from '../../config/env.js'
import { Permission } from '../../domain/permissions.js'
import { AppError } from '../../errors/app-error.js'
import { z } from 'zod'

type LoginAttemptState = {
    count: number
    resetAt: number
}

const loginAttempts = new Map<string, LoginAttemptState>()

function getLoginUsername(request: FastifyRequest) {
    const body = request.body

    if (!body || typeof body !== 'object' || !('username' in body)) {
        return 'unknown-user'
    }

    const username = body.username
    return typeof username === 'string' && username.trim() !== ''
        ? username.trim()
        : 'unknown-user'
}

function getRequestKey(request: FastifyRequest) {
    const ipAddress = request.ip?.trim() || 'unknown'
    return `${ipAddress}:${getLoginUsername(request)}`
}

async function enforceLoginRateLimit(request: FastifyRequest, reply: FastifyReply) {
    const key = getRequestKey(request)
    const now = Date.now()
    const current = loginAttempts.get(key)

    if (!current) {
        return
    }

    if (current.resetAt <= now) {
        loginAttempts.delete(key)
        return
    }

    if (current.count < env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
        return
    }

    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000)
    reply.header('Retry-After', String(retryAfterSeconds))
    return reply.status(429).send({ error: 'Too many login attempts' })
}

function registerFailedLoginAttempt(request: FastifyRequest) {
    const key = getRequestKey(request)
    const now = Date.now()
    const current = loginAttempts.get(key)

    if (!current || current.resetAt <= now) {
        loginAttempts.set(key, {
            count: 1,
            resetAt: now + env.LOGIN_RATE_LIMIT_WINDOW_MS,
        })
        return
    }

    current.count += 1
}

function clearLoginAttempts(request: FastifyRequest) {
    loginAttempts.delete(getRequestKey(request))
}

/**
 * Auth routes plugin.
 *
 * POST /api/auth/login   — authenticate and receive cookie
 * POST /api/auth/logout  — clear auth cookie
 * GET  /api/auth/me      — get current authenticated user
 */
const authRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new AuthRepository(fastify.prisma)
    const service = new AuthService(
        repository,
        (payload) => fastify.jwt.sign(payload, { expiresIn: '8h' })
    )
    const controller = new AuthController(service)

    fastify.post('/login', {
        preHandler: [enforceLoginRateLimit],
        schema: {
            hide: true,
            body: loginSchema,
            tags: ['auth'],
            summary: 'Admin login',
            response: {
                200: authResponseSchema
            }
        },
        handler: async (req: FastifyRequest<{ Body: LoginInput }>, reply) => {
            try {
                await controller.login(req, reply)
                clearLoginAttempts(req)
            } catch (error) {
                if (error instanceof AppError && error.statusCode === 401) {
                    registerFailedLoginAttempt(req)
                }

                throw error
            }
        },
    })

    fastify.post('/logout', {
        schema: {
            hide: true,
            tags: ['auth'],
            summary: 'Logout (clear cookie)',
            response: {
                200: z.object({
                    data: z.object({ success: z.boolean() }),
                    links: z.object({ self: z.string() })
                })
            }
        },
        handler: (req, reply) => controller.logout(req, reply),
    })

    fastify.get('/me', {
        preHandler: [requirePermission(Permission.ARCHIVE_READ)],
        schema: {
            hide: true,
            tags: ['auth'],
            summary: 'Get current user info',
            response: {
                200: meResponseSchema
            }
        },
        handler: (req, reply) => controller.me(req, reply),
    })

    fastify.patch('/me', {
        preHandler: [requirePermission(Permission.ARCHIVE_READ)],
        schema: {
            hide: true,
            tags: ['auth'],
            summary: 'Update current user info',
            body: updateMeSchema,
            response: {
                200: meResponseSchema,
                401: errorSchema,
                404: errorSchema,
                409: errorSchema,
            }
        },
        handler: (req: FastifyRequest<{ Body: UpdateMeInput }>, reply) => controller.updateMe(req, reply),
    })
}

export default authRoutes
