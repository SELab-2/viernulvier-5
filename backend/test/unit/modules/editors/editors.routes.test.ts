import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../../helpers/build-app.js'

describe('Editors Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/v1/editors', () => {
        it('should return a list of editors with 200 OK for ADMIN', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/editors',
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
        })

        it('should only return editor accounts', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const suffix = Date.now()
            const admin = await app.prisma.adminUser.create({
                data: {
                    username: `editor-route-admin-${suffix}`,
                    passwordHash: 'password-hash',
                    role: 'ADMIN',
                },
            })
            const editor = await app.prisma.adminUser.create({
                data: {
                    username: `editor-route-editor-${suffix}`,
                    passwordHash: 'password-hash',
                    role: 'EDITOR',
                },
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/editors?search=${suffix}`,
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

            await app.prisma.adminUser.deleteMany({ where: { id: { in: [admin.id, editor.id] } } })
        })

        it('should return 403 Forbidden for EDITOR role', async () => {
            const token = app.jwt.sign({ sub: 'editor', role: 'EDITOR' })
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/editors',
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(403)
        })
    })

    describe('POST /api/v1/editors', () => {
        it('should create an editor and return RESTful structure', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = {
                username: 'new-editor-' + Date.now(),
                password: 'password123'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/editors',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = response.json()
            expect(body.data.username).toBe(payload.username)
            expect(body.data).toHaveProperty('links')
            expect(body.links).toHaveProperty('self')

            await app.prisma.adminUser.delete({ where: { id: body.data.id } })
        })
    })

    describe('GET /api/v1/editors/:id', () => {
        it('should return 404 for non-existent editor', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/editors/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('PATCH /api/v1/editors/:id', () => {
        it('should update an editor', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })

            const createResp = await app.inject({
                method: 'POST',
                url: '/api/v1/editors',
                headers: { authorization: `Bearer ${token}` },
                payload: { username: 'to-update-' + Date.now(), password: 'password123' }
            })
            const created = createResp.json().data

            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/editors/${created.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { username: 'updated-' + Date.now() }
            })

            expect(response.statusCode).toBe(200)
            const body = response.json()
            expect(body.data).toHaveProperty('links')
            
            await app.prisma.adminUser.delete({ where: { id: created.id } })
        })
    })

    describe('DELETE /api/v1/editors/:id', () => {
        it('should delete an editor', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })

            const createResp = await app.inject({
                method: 'POST',
                url: '/api/v1/editors',
                headers: { authorization: `Bearer ${token}` },
                payload: { username: 'to-delete-' + Date.now(), password: 'password123' }
            })
            const created = createResp.json().data

            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/editors/${created.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.adminUser.findUnique({ where: { id: created.id } })
            expect(dbRecord).toBeNull()
        })
    })
})
