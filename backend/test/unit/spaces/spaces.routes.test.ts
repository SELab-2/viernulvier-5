import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Spaces Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    it('GET /api/archive/spaces should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/spaces' })
        expect(response.statusCode).toBe(200)
    })

    describe('GET /api/archive/spaces/:id', () => {
        it('should return a space by ID with 200 OK', async () => {
            const space = await app.prisma.space.create({
                data: {
                    name: { nl: 'Test Space' }
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/spaces/${space.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(space.id)

            await app.prisma.space.delete({ where: { id: space.id } })
        })

        it('should return 404 for non-existent space', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/spaces/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/archive/spaces', () => {
        it('should create a space and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/spaces',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: { nl: 'New Space POST' } }
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.name.nl).toBe('New Space POST')

            await app.prisma.space.delete({ where: { id: body.id } })
        })
    })

    describe('PUT /api/archive/spaces/:id', () => {
        it('should update a space and clean up', async () => {
            const space = await app.prisma.space.create({
                data: { name: { nl: 'Original Space' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/spaces/${space.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { name: { nl: 'Updated Space' } }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.name.nl).toBe('Updated Space')

            await app.prisma.space.delete({ where: { id: space.id } })
        })
    })

    describe('DELETE /api/archive/spaces/:id', () => {
        it('should delete a space', async () => {
            const space = await app.prisma.space.create({
                data: { name: { nl: 'To Delete' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/archive/spaces/${space.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.space.findUnique({ where: { id: space.id } })
            expect(dbRecord).toBeNull()
        })
    })
})
