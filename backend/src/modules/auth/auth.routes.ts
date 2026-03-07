import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { AuthRepository } from './auth.repository.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { loginSchema } from './auth.schema.js'
import { env } from '../../config/env.js'
import { Permission } from '../../domain/permissions.js'

type LoginAttemptState = {
    count: number
    resetAt: number
}

const loginAttempts = new Map<string, LoginAttemptState>()

function getRequestKey(ipAddress: string | undefined) {
    return ipAddress?.trim() || 'unknown'
}

async function enforceLoginRateLimit(request: FastifyRequest, reply: FastifyReply) {
    const key = getRequestKey(request.ip)
    const now = Date.now()
    const current = loginAttempts.get(key)

    if (!current || current.resetAt <= now) {
        loginAttempts.set(key, {
            count: 1,
            resetAt: now + env.LOGIN_RATE_LIMIT_WINDOW_MS,
        })
        return
    }

    if (current.count >= env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
        const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000)
        reply.header('Retry-After', String(retryAfterSeconds))
        return reply.status(429).send({ error: 'Too many login attempts' })
    }

    current.count += 1
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
            body: loginSchema,
            tags: ['auth'],
            summary: 'Admin login',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Placeholder typing while auth flow is scaffolded.
        handler: (req, reply) => controller.login(req as any, reply),
    })

    fastify.post('/logout', {
        schema: {
            tags: ['auth'],
            summary: 'Logout (clear cookie)',
        },
        handler: (req, reply) => controller.logout(req, reply),
    })

    fastify.get('/me', {
        preHandler: [requirePermission(Permission.ARCHIVE_READ)],
        schema: {
            tags: ['auth'],
            summary: 'Get current user info',
        },
        handler: (req, reply) => controller.me(req, reply),
    })
}

export default authRoutes
