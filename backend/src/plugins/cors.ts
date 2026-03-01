import fp from 'fastify-plugin'
import cors from '@fastify/cors'

/**
 * CORS plugin — configured for local development.
 * In production, restrict origins to actual frontend domains.
 */
export default fp(async (fastify) => {
    await fastify.register(cors, {
        origin: [
            'http://localhost:5173',     // Vite dev server
            'http://localhost:3000',     // Alternative frontend port
        ],
        credentials: true,            // Required for cookie-based auth
    })
})
