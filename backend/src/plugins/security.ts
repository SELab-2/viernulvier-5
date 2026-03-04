import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'

/**
 * Security plugin — adds security headers via Helmet.
 */
export default fp(async (fastify) => {
    await fastify.register(helmet, {
        // Relax CSP in development for Swagger UI
        contentSecurityPolicy: false,
    })
})
