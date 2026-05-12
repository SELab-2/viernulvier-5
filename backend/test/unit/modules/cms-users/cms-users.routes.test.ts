import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../../helpers/build-app.js'

async function deleteUsersIfExist(app: FastifyInstance, ids: Array<string | undefined>) {
    await app.prisma.adminUser.deleteMany({ where: { id: { in: ids.filter((id): id is string => Boolean(id)) } } })
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

            await deleteUsersIfExist(app, [admin.id, editor.id])
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

            await deleteUsersIfExist(app, [admin.id])
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

    describe('GET /api/v1/cms-users/editors', () => {
        it('returns only editors for ADMIN users', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const suffix = Date.now()
            const admin = await app.prisma.adminUser.create({
                data: {
                    username: `cms-editor-route-admin-${suffix}`,
                    passwordHash: 'password-hash',
                    role: 'ADMIN',
                },
            })
            const editor = await app.prisma.adminUser.create({
                data: {
                    username: `cms-editor-route-editor-${suffix}`,
                    passwordHash: 'password-hash',
                    role: 'EDITOR',
                },
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/cms-users/editors?search=${suffix}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: editor.id, username: editor.username, role: 'EDITOR' }),
            ]))
            expect(body.data).not.toEqual(expect.arrayContaining([
                expect.objectContaining({ id: admin.id, username: admin.username, role: 'ADMIN' }),
            ]))

            await deleteUsersIfExist(app, [admin.id, editor.id])
        })
    })

    describe('POST /api/v1/cms-users/editors', () => {
        it('creates an editor and returns RESTful structure', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = {
                username: 'new-editor-' + Date.now(),
                password: 'password123'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/cms-users/editors',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = response.json()
            expect(body.data.username).toBe(payload.username)
            expect(body.data.role).toBe('EDITOR')
            expect(body.data).toHaveProperty('links')
            expect(body.links).toHaveProperty('self')

            await deleteUsersIfExist(app, [body.data.id])
        })
    })

    describe('GET /api/v1/cms-users/editors/:id', () => {
        it('returns 404 for an admin user', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const admin = await app.prisma.adminUser.create({
                data: {
                    username: 'cms-editor-detail-admin-' + Date.now(),
                    passwordHash: 'password-hash',
                    role: 'ADMIN',
                },
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/cms-users/editors/${admin.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(404)

            await deleteUsersIfExist(app, [admin.id])
        })
    })

    describe('PATCH /api/v1/cms-users/editors/:id', () => {
        it('updates an editor username', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const createResp = await app.inject({
                method: 'POST',
                url: '/api/v1/cms-users/editors',
                headers: { authorization: `Bearer ${token}` },
                payload: { username: 'to-update-' + Date.now(), password: 'password123' }
            })
            const created = createResp.json().data

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/cms-users/editors/${created.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { username: 'updated-' + Date.now() }
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data.role).toBe('EDITOR')
            expect(body.data).toHaveProperty('links')

            await deleteUsersIfExist(app, [created.id])
        })
    })

    describe('DELETE /api/v1/cms-users/editors/:id', () => {
        it('deletes an editor', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const createResp = await app.inject({
                method: 'POST',
                url: '/api/v1/cms-users/editors',
                headers: { authorization: `Bearer ${token}` },
                payload: { username: 'to-delete-' + Date.now(), password: 'password123' }
            })
            const created = createResp.json().data

            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/cms-users/editors/${created.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.adminUser.findUnique({ where: { id: created.id } })
            expect(dbRecord).toBeNull()
        })
    })
})
