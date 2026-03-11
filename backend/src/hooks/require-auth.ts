import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Authentication hook — verifies JWT from cookie.
 * Use as `preHandler` on routes that require admin access.
 *
 * @example
 * fastify.post('/admin-only', { preHandler: [requireAuth] }, handler)
 */
export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        await request.jwtVerify()
    } catch {
        reply.status(401).send({ error: 'Authentication required' })
    }
}
