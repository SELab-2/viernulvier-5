import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { env } from '../config/env.js'

const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
]

/**
 * CORS plugin — configured for local development.
 * In production, restrict origins to actual frontend domains.
 */
export default fp(async (fastify) => {
    const allowedOrigins = env.ALLOWED_ORIGINS
        ? env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
        : defaultAllowedOrigins

    await fastify.register(cors, {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true)
                return
            }

            callback(new Error('Origin not allowed by CORS'), false)
        },
        credentials: true,
    })
})
