import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { env } from '../config/env.js'

const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
]

const localDevHostnames = new Set(['localhost', '127.0.0.1', '::1'])

function isLocalDevOrigin(origin: string): boolean {
    try {
        const { hostname } = new URL(origin)
        return localDevHostnames.has(hostname)
    } catch {
        return false
    }
}

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
    if (!origin) {
        return true
    }

    if (allowedOrigins.includes(origin)) {
        return true
    }

    return env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)
}

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
            callback(null, isOriginAllowed(origin, allowedOrigins))
        },
        credentials: true,
    })
})
