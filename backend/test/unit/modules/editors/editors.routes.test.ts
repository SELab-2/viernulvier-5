import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('editors routes', () => {
    let app: Awaited<ReturnType<typeof Fastify>>
    let findMany: ReturnType<typeof vi.fn>
    let findFirst: ReturnType<typeof vi.fn>
    let findUnique: ReturnType<typeof vi.fn>
    let create: ReturnType<typeof vi.fn>
    let update: ReturnType<typeof vi.fn>
    let remove: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        vi.resetModules()
        process.env.JWT_SECRET = 'test-jwt-secret'
        process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/viernulvier'
        process.env.NODE_ENV = 'test'

        const authPlugin = (await import('../../../../src/plugins/auth.js')).default
        const editorsRoutes = (await import('../../../../src/modules/editors/editors.routes.js')).default

        findMany = vi.fn()
        findFirst = vi.fn()
        findUnique = vi.fn()
        create = vi.fn()
        update = vi.fn()
        remove = vi.fn()

        app = Fastify({ logger: false })
        app.setValidatorCompiler(validatorCompiler)
        app.setSerializerCompiler(serializerCompiler)
        await app.register(authPlugin)
        app.decorate('prisma', {
            adminUser: {
                findMany,
                findFirst,
                findUnique,
                create,
                update,
                delete: remove,
            },
        })
        await app.register(editorsRoutes, { prefix: '/api/editors' })
    })

    afterEach(async () => {
        await app.close()
    })

    it('rejects editor tokens for editor management routes', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/editors',
            cookies: {
                token: app.jwt.sign({ sub: 'editor-id', username: 'editor', role: 'EDITOR' }),
            },
        })

        expect(response.statusCode).toBe(403)
        expect(response.json()).toEqual({ error: 'Forbidden' })
    })

    it('lists editor accounts for admins', async () => {
        findMany.mockResolvedValue([
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                username: 'editor',
                role: 'EDITOR',
                createdAt: new Date('2026-03-01T12:00:00.000Z'),
                updatedAt: new Date('2026-03-01T12:00:00.000Z'),
            },
        ])

        const response = await app.inject({
            method: 'GET',
            url: '/api/editors',
            cookies: {
                token: app.jwt.sign({ sub: 'admin-id', username: 'admin', role: 'ADMIN' }),
            },
        })

        expect(response.statusCode).toBe(200)
        expect(findMany).toHaveBeenCalledWith({
            where: { role: 'EDITOR' },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { username: 'asc' },
        })
        expect(response.json()).toEqual({
            editors: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    username: 'editor',
                    role: 'EDITOR',
                    createdAt: '2026-03-01T12:00:00.000Z',
                    updatedAt: '2026-03-01T12:00:00.000Z',
                },
            ],
        })
    })

    it('creates a new editor account for admins', async () => {
        findUnique.mockResolvedValue(null)
        create.mockImplementation(async ({ data }) => ({
            id: '550e8400-e29b-41d4-a716-446655440000',
            username: data.username,
            role: data.role,
            createdAt: new Date('2026-03-01T12:00:00.000Z'),
            updatedAt: new Date('2026-03-01T12:00:00.000Z'),
        }))

        const response = await app.inject({
            method: 'POST',
            url: '/api/editors',
            cookies: {
                token: app.jwt.sign({ sub: 'admin-id', username: 'admin', role: 'ADMIN' }),
            },
            payload: {
                username: 'new-editor',
                password: 'editor12345',
            },
        })

        expect(response.statusCode).toBe(201)
        expect(create.mock.calls[0][0].data.username).toBe('new-editor')
        expect(create.mock.calls[0][0].data.role).toBe('EDITOR')
        expect(create.mock.calls[0][0].data.passwordHash).not.toBe('editor12345')
        expect(response.json()).toEqual({
            editor: {
                id: '550e8400-e29b-41d4-a716-446655440000',
                username: 'new-editor',
                role: 'EDITOR',
                createdAt: '2026-03-01T12:00:00.000Z',
                updatedAt: '2026-03-01T12:00:00.000Z',
            },
        })
    })

    it('updates an existing editor account for admins', async () => {
        const editorId = '550e8400-e29b-41d4-a716-446655440000'

        findFirst.mockResolvedValue({
            id: editorId,
            username: 'editor',
            role: 'EDITOR',
            createdAt: new Date('2026-03-01T12:00:00.000Z'),
            updatedAt: new Date('2026-03-01T12:00:00.000Z'),
        })
        findUnique.mockResolvedValue(null)
        update.mockImplementation(async ({ data }) => ({
            id: editorId,
            username: data.username ?? 'editor',
            role: 'EDITOR',
            createdAt: new Date('2026-03-01T12:00:00.000Z'),
            updatedAt: new Date('2026-03-02T12:00:00.000Z'),
        }))

        const response = await app.inject({
            method: 'PATCH',
            url: `/api/editors/${editorId}`,
            cookies: {
                token: app.jwt.sign({ sub: 'admin-id', username: 'admin', role: 'ADMIN' }),
            },
            payload: {
                username: 'updated-editor',
                password: 'updated12345',
            },
        })

        expect(response.statusCode).toBe(200)
        expect(update).toHaveBeenCalledOnce()
        expect(update.mock.calls[0][0].data.username).toBe('updated-editor')
        expect(update.mock.calls[0][0].data.passwordHash).not.toBe('updated12345')
        expect(response.json()).toEqual({
            editor: {
                id: editorId,
                username: 'updated-editor',
                role: 'EDITOR',
                createdAt: '2026-03-01T12:00:00.000Z',
                updatedAt: '2026-03-02T12:00:00.000Z',
            },
        })
    })

    it('deletes an editor account for admins', async () => {
        const editorId = '550e8400-e29b-41d4-a716-446655440000'

        findFirst.mockResolvedValue({
            id: editorId,
            username: 'editor',
            role: 'EDITOR',
            createdAt: new Date('2026-03-01T12:00:00.000Z'),
            updatedAt: new Date('2026-03-01T12:00:00.000Z'),
        })
        remove.mockResolvedValue({
            id: editorId,
            username: 'editor',
            role: 'EDITOR',
            createdAt: new Date('2026-03-01T12:00:00.000Z'),
            updatedAt: new Date('2026-03-01T12:00:00.000Z'),
        })

        const response = await app.inject({
            method: 'DELETE',
            url: `/api/editors/${editorId}`,
            cookies: {
                token: app.jwt.sign({ sub: 'admin-id', username: 'admin', role: 'ADMIN' }),
            },
        })

        expect(response.statusCode).toBe(204)
        expect(remove).toHaveBeenCalledWith({
            where: { id: editorId },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        })
    })
})
