import type { FastifyPluginAsync } from 'fastify'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { requireAuth } from '../../hooks/require-auth.js'
import { loginSchema } from './auth.schema.js'

/**
 * Auth routes plugin.
 *
 * POST /api/auth/login   — authenticate and receive cookie
 * POST /api/auth/logout  — clear auth cookie
 * GET  /api/auth/me      — get current authenticated user
 */
const authRoutes: FastifyPluginAsync = async (fastify) => {
    const service = new AuthService(fastify)
    const controller = new AuthController(service)

    fastify.post('/login', {
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
        preHandler: [requireAuth],
        schema: {
            tags: ['auth'],
            summary: 'Get current user info',
        },
        handler: (req, reply) => controller.me(req, reply),
    })
}

export default authRoutes
