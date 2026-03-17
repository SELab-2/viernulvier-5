import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('auth routes', () => {
    let app: Awaited<ReturnType<typeof Fastify>>
    let findUnique: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        vi.resetModules()
        process.env.JWT_SECRET = 'test-jwt-secret'
        process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/viernulvier'
        process.env.NODE_ENV = 'test'
        process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
        process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS = '2'
        process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '60000'

        const { hashPassword } = await import('../../../../src/utils/password.js')
        const authPlugin = (await import('../../../../src/plugins/auth.js')).default
        const authRoutes = (await import('../../../../src/modules/auth/auth.routes.js')).default

        findUnique = vi.fn()
        const passwordHash = await hashPassword('admin12345')

        findUnique.mockImplementation(async ({ where: { username, id } }) => {
            const userId = id || (username === 'editor' 
                ? '00000000-0000-0000-0000-000000000002' 
                : '00000000-0000-0000-0000-000000000001')
            
            return {
                id: userId,
                username: username || (userId === '00000000-0000-0000-0000-000000000002' ? 'editor' : 'admin'),
                passwordHash,
                role: (username === 'editor' || userId === '00000000-0000-0000-0000-000000000002') ? 'EDITOR' : 'ADMIN',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        })

        app = Fastify({ logger: false })
        app.setValidatorCompiler(validatorCompiler)
        app.setSerializerCompiler(serializerCompiler)
        await app.register(authPlugin)
        app.decorate('prisma', {
            adminUser: {
                findUnique,
            },
        })
        await app.register(authRoutes, { prefix: '/api/v1/auth' })
    })

    afterEach(async () => {
        await app.close()
    })

    it('logs in with a database user and sets a cookie (no token in body)', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: {
                username: 'admin',
                password: 'admin12345',
            },
        })

        expect(response.statusCode).toBe(200)
        expect(findUnique).toHaveBeenCalledWith({ where: { username: 'admin' } })
        expect(response.cookies.find((cookie) => cookie.name === 'token')).toBeTruthy()
        
        const body = response.json()
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveProperty('user')
        expect(body.data).not.toHaveProperty('token') // Verify token is NOT in body
        expect(body).toHaveProperty('links')
    })

    it('returns the current user from the JWT cookie with RESTful structure', async () => {
        const loginResponse = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: {
                username: 'admin',
                password: 'admin12345',
            },
        })

        const tokenCookie = loginResponse.cookies.find((cookie) => cookie.name === 'token')

        const meResponse = await app.inject({
            method: 'GET',
            url: '/api/v1/auth/me',
            cookies: {
                token: tokenCookie?.value ?? '',
            },
        })

        expect(meResponse.statusCode).toBe(200)
        const body = meResponse.json()
        expect(body.data.username).toBe('admin')
        expect(body.data).toHaveProperty('links')
        expect(body.links.self).toContain('/api/v1/auth/me')
    })

    it('rate limits repeated failed login attempts', async () => {
        findUnique.mockResolvedValueOnce(null)
        findUnique.mockResolvedValueOnce(null)
        findUnique.mockResolvedValueOnce(null)

        const first = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        const second = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        const third = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        expect(first.statusCode).toBe(401)
        expect(second.statusCode).toBe(401)
        expect(third.statusCode).toBe(429)
    })

    it('does not count successful logins toward the rate limit', async () => {
        const first = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'admin12345' },
        })

        const second = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'admin12345' },
        })

        const third = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'admin12345' },
        })

        expect(first.statusCode).toBe(200)
        expect(second.statusCode).toBe(200)
        expect(third.statusCode).toBe(200)
    })

    it('clears failed login attempts after a successful login', async () => {
        findUnique.mockResolvedValueOnce(null)

        const failedBeforeSuccess = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        const successfulLogin = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'admin12345' },
        })

        findUnique.mockResolvedValueOnce(null)
        findUnique.mockResolvedValueOnce(null)
        findUnique.mockResolvedValueOnce(null)

        const failedAfterReset = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        const secondFailedAfterReset = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        const blockedAttempt = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        expect(failedBeforeSuccess.statusCode).toBe(401)
        expect(successfulLogin.statusCode).toBe(200)
        expect(failedAfterReset.statusCode).toBe(401)
        expect(secondFailedAfterReset.statusCode).toBe(401)
        expect(blockedAttempt.statusCode).toBe(429)
    })

    it('does not clear another username throttle bucket after a successful login', async () => {
        const firstAdminFailure = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        const secondAdminFailure = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        const otherUserSuccess = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'editor', password: 'admin12345' },
        })

        const blockedAdminAttempt = await app.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { username: 'admin', password: 'wrongpass' },
        })

        expect(firstAdminFailure.statusCode).toBe(401)
        expect(secondAdminFailure.statusCode).toBe(401)
        expect(otherUserSuccess.statusCode).toBe(200)
        expect(blockedAdminAttempt.statusCode).toBe(429)
    })
})
