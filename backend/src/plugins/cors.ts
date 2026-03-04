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
            'http://127.0.0.1:5173',     // Vite dev server on loopback IP
            'http://127.0.0.1:3000',     // Alternative frontend port on loopback IP
        ],
        credentials: true,            // Required for cookie-based auth
    })
})
