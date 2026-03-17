import Fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('cors plugin', () => {
    let app: Awaited<ReturnType<typeof Fastify>>

    beforeEach(async () => {
        vi.resetModules()
        process.env.JWT_SECRET = 'test-jwt-secret'
        process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/viernulvier'
        process.env.NODE_ENV = 'test'
        process.env.ALLOWED_ORIGINS = 'http://localhost:5173'

        const corsPlugin = (await import('../../../src/plugins/cors.js')).default

        app = Fastify({ logger: false })
        await app.register(corsPlugin)
        app.get('/ping', async () => ({ ok: true }))
    })

    afterEach(async () => {
        await app.close()
    })

    it('sets CORS headers for explicitly allowed origins', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/ping',
            headers: {
                origin: 'http://localhost:5173',
            },
        })

        expect(response.statusCode).toBe(200)
        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    })

    it('allows localhost origins on other ports outside production', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/ping',
            headers: {
                origin: 'http://localhost:4173',
            },
        })

        expect(response.statusCode).toBe(200)
        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4173')
    })

    it('denies unknown origins without turning the request into a 500', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/ping',
            headers: {
                origin: 'https://evil.example',
            },
        })

        expect(response.statusCode).toBe(200)
        expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
})
