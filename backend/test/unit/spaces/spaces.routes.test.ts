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

    describe('GET /api/v1/archive/spaces', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/spaces',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(body.meta.page).toBe(1)
        })

        it('should work with a search query', async () => {
            const space = await app.prisma.space.create({
                data: { name: { nl: 'Searchable Space' } }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/spaces',
                    query: { search: 'Searchable' }
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.length).toBeGreaterThanOrEqual(1)
                expect(body.data[0].name.nl).toBe('Searchable Space')
            } finally {
                await app.prisma.space.delete({ where: { id: space.id } })
            }
        })
    })

    describe('GET /api/v1/archive/spaces/:id', () => {
        it('should return a space by ID with 200 OK', async () => {
            const space = await app.prisma.space.create({
                data: {
                    name: { nl: 'Test Space' }
                }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/archive/spaces/${space.id}`
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(space.id)
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.space.delete({ where: { id: space.id } })
            }
        })

        it('should return 404 for non-existent space', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/spaces/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/v1/archive/spaces', () => {
        it('should create a space and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = { 
                name: { nl: 'New Space POST' }
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/spaces',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.data.name.nl).toBe('New Space POST')
            expect(body.links).toHaveProperty('self')

            await app.prisma.space.delete({ where: { id: body.data.id } })
        })
    })

    describe('PATCH /api/v1/archive/spaces/:id', () => {
        it('should update a space and clean up', async () => {
            const space = await app.prisma.space.create({
                data: { name: { nl: 'Original Space' } }
            })

            try {
                const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/spaces/${space.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: { name: { nl: 'Updated Space' } }
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.name.nl).toBe('Updated Space')
                expect(body.data).toHaveProperty('links')
            } finally {
                await app.prisma.space.delete({ where: { id: space.id } })
            }
        })

        it('should return 404 for non-existent space', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/spaces/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: { nl: 'Non-existent' } }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/spaces/:id', () => {
        it('should delete a space', async () => {
            const space = await app.prisma.space.create({
                data: { name: { nl: 'To Delete' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/spaces/${space.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.space.findUnique({ where: { id: space.id } })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent space', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/spaces/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
