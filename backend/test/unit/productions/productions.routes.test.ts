import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Productions Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/v1/archive/productions', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/productions',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(body.meta.page).toBe(1)
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('GET /api/v1/archive/productions/:id', () => {
        it('should return a production by ID with 200 OK', async () => {
            const production = await app.prisma.production.create({
                data: {
                    title: { nl: 'Test Production by ID' },
                    artist: { nl: 'Test Artist' }
                }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/archive/productions/${production.id}`,
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(production.id)
                expect(body.data.title.nl).toBe('Test Production by ID')
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.production.delete({
                    where: { id: production.id }
                })
            }
        })

        it('should return 404 Not Found for non-existent ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/archive/productions/${nonExistentId}`,
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.payload)
            expect(body.message).toBe('Production not found')
        })
    })

    describe('POST /api/v1/archive/productions', () => {
        it('should create a production in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = { 
                title: { nl: 'Test New Production' },
                artist: { nl: 'Test New Artist' }
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/productions',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            const created = body.data

            const dbRecord = await app.prisma.production.findUnique({
                where: { id: created.id }
            })
            expect(dbRecord).not.toBeNull()
            expect((dbRecord?.title as any).nl).toBe(payload.title.nl)
            expect(body.links).toHaveProperty('self')

            await app.prisma.production.delete({
                where: { id: created.id }
            })
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/productions',
                payload: { title: { nl: 'Unauthorized' } }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('PATCH /api/v1/archive/productions/:id', () => {
        it('should update a production in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            const initialProd = await app.prisma.production.create({
                data: {
                    title: { nl: 'Initial Title' },
                    artist: { nl: 'Initial Artist' }
                }
            })

            const updatePayload = { title: { nl: 'Updated Title' } }

            try {
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/productions/${initialProd.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: updatePayload
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                const updated = body.data
                expect(updated.title.nl).toBe(updatePayload.title.nl)
                expect(updated.links).toHaveProperty('self')
            } finally {
                await app.prisma.production.delete({
                    where: { id: initialProd.id }
                })
            }
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const id = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/archive/productions/${id}`,
                payload: { title: { nl: 'Unauthorized' } }
            })

            expect(response.statusCode).toBe(401)
        })

        it('should return 404 for non-existent production', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { title: { nl: 'Non-existent' } }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/productions/:id', () => {
        it('should return 401 when no token provided', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(401)
        })

        it('should delete a production', async () => {
            const production = await app.prisma.production.create({
                data: { title: { nl: 'To Be Deleted' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/productions/${production.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)

            const dbRecord = await app.prisma.production.findUnique({
                where: { id: production.id }
            })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent production', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
