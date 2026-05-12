import Fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('requirePermission', () => {
    let app: Awaited<ReturnType<typeof Fastify>>

    beforeEach(async () => {
        process.env.JWT_SECRET = 'test-jwt-secret'
        process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/viernulvier'
        process.env.NODE_ENV = 'test'

        const authPlugin = (await import('../../../src/plugins/auth.js')).default
        const { requirePermission } = await import('../../../src/hooks/require-permission.js')
        const { Permission } = await import('../../../src/domain/permissions.js')

        app = Fastify({ logger: false })
        await app.register(authPlugin)

        app.get('/archive-delete', {
            preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
            handler: async () => ({ success: true }),
        })

        app.get('/editors-manage', {
            preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
            handler: async () => ({ success: true }),
        })
    })

    afterEach(async () => {
        await app.close()
    })

    it('returns 401 without a token', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/archive-delete',
        })

        expect(response.statusCode).toBe(401)
    })

    it('allows an ADMIN token through for CMS user management', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/editors-manage',
            cookies: {
                token: app.jwt.sign({ sub: 'admin-id', username: 'admin', role: 'ADMIN' }),
            },
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ success: true })
    })

    it('allows an EDITOR token to delete archive items', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/archive-delete',
            cookies: {
                token: app.jwt.sign({ sub: 'editor-id', username: 'editor', role: 'EDITOR' }),
            },
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ success: true })
    })

    it('rejects an EDITOR token without the needed admin permission', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/editors-manage',
            cookies: {
                token: app.jwt.sign({ sub: 'editor-id', username: 'editor', role: 'EDITOR' }),
            },
        })

        expect(response.statusCode).toBe(403)
        expect(response.json()).toEqual({ error: 'Forbidden' })
    })
})
