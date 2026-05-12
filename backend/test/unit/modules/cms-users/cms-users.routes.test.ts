import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../../helpers/build-app.js'

async function deleteUserIfExists(app: FastifyInstance, id: string | undefined) {
    if (!id) {
        return
    }

    await app.prisma.adminUser.deleteMany({ where: { id } })
}

describe('CMS Users Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/v1/cms-users', () => {
        it('returns editors and admins for ADMIN users', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const suffix = Date.now()
            const admin = await app.prisma.adminUser.create({
                data: {
                    username: `cms-admin-${suffix}`,
                    passwordHash: 'password-hash',
                    role: 'ADMIN',
                },
            })
            const editor = await app.prisma.adminUser.create({
                data: {
                    username: `cms-editor-${suffix}`,
                    passwordHash: 'password-hash',
                    role: 'EDITOR',
                },
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/cms-users?search=${suffix}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: admin.id, username: admin.username, role: 'ADMIN' }),
                expect.objectContaining({ id: editor.id, username: editor.username, role: 'EDITOR' }),
            ]))
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')

            await deleteUserIfExists(app, admin.id)
            await deleteUserIfExists(app, editor.id)
        })

        it('returns 403 Forbidden for EDITOR role', async () => {
            const token = app.jwt.sign({ sub: 'editor', role: 'EDITOR' })
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/cms-users',
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(403)
        })
    })

    describe('POST /api/v1/cms-users', () => {
        it('creates a cms user with the requested role and returns RESTful structure', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = {
                username: 'new-cms-admin-' + Date.now(),
                password: 'password123',
                role: 'ADMIN',
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/cms-users',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = response.json()
            expect(body.data.username).toBe(payload.username)
            expect(body.data.role).toBe('ADMIN')
            expect(body.data).toHaveProperty('links')
            expect(body.links).toHaveProperty('self')

            await deleteUserIfExists(app, body.data.id)
        })
    })

    describe('GET /api/v1/cms-users/:id', () => {
        it('returns an admin cms user by id', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const admin = await app.prisma.adminUser.create({
                data: {
                    username: 'cms-admin-detail-' + Date.now(),
                    passwordHash: 'password-hash',
                    role: 'ADMIN',
                },
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/cms-users/${admin.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toEqual(expect.objectContaining({
                id: admin.id,
                username: admin.username,
                role: 'ADMIN',
            }))

            await deleteUserIfExists(app, admin.id)
        })

        it('returns 404 for non-existent cms user', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/cms-users/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('PATCH /api/v1/cms-users/:id', () => {
        it('updates a cms user role', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const createResp = await app.inject({
                method: 'POST',
                url: '/api/v1/cms-users',
                headers: { authorization: `Bearer ${token}` },
                payload: { username: 'to-update-' + Date.now(), password: 'password123', role: 'EDITOR' }
            })
            const created = createResp.json().data

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/cms-users/${created.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { role: 'ADMIN' }
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.role).toBe('ADMIN')
            expect(body.data).toHaveProperty('links')

            await deleteUserIfExists(app, created.id)
        })
    })

    describe('DELETE /api/v1/cms-users/:id', () => {
        it('deletes a cms user', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const createResp = await app.inject({
                method: 'POST',
                url: '/api/v1/cms-users',
                headers: { authorization: `Bearer ${token}` },
                payload: { username: 'to-delete-' + Date.now(), password: 'password123' }
            })
            const created = createResp.json().data

            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/cms-users/${created.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.adminUser.findUnique({ where: { id: created.id } })
            expect(dbRecord).toBeNull()
        })

        it('does not allow an admin to delete themselves', async () => {
            const admin = await app.prisma.adminUser.create({
                data: {
                    username: 'self-delete-admin-' + Date.now(),
                    passwordHash: 'password-hash',
                    role: 'ADMIN',
                },
            })
            const token = app.jwt.sign({ sub: admin.id, username: admin.username, role: 'ADMIN' })

            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/cms-users/${admin.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(400)
            expect(response.json().message).toBe('Cannot delete your own account')

            await deleteUserIfExists(app, admin.id)
        })
    })
})
