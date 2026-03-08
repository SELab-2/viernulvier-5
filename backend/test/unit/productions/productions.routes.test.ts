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

    describe('GET /api/archive/productions', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/productions',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body.meta.page).toBe(1)
        })
    })

    describe('GET /api/archive/productions/:id', () => {
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
                    url: `/api/archive/productions/${production.id}`,
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.id).toBe(production.id)
                expect(body.title.nl).toBe('Test Production by ID')
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
                url: `/api/archive/productions/${nonExistentId}`,
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.payload)
            expect(body.message).toBe('Production not found')
        })
    })

    describe('POST /api/archive/productions', () => {
        it('should create a production in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = { 
                title: { nl: 'Test New Production' },
                artist: { nl: 'Test New Artist' }
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/productions',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const created = JSON.parse(response.payload)

            const dbRecord = await app.prisma.production.findUnique({
                where: { id: created.id }
            })
            expect(dbRecord).not.toBeNull()
            expect((dbRecord?.title as any).nl).toBe(payload.title.nl)

            await app.prisma.production.delete({
                where: { id: created.id }
            })
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/productions',
                payload: { title: { nl: 'Unauthorized' } }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('PUT /api/archive/productions/:id', () => {
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
                    method: 'PUT',
                    url: `/api/archive/productions/${initialProd.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: updatePayload
                })

                expect(response.statusCode).toBe(200)
                const updated = JSON.parse(response.payload)
                expect(updated.title.nl).toBe(updatePayload.title.nl)
            } finally {
                await app.prisma.production.delete({
                    where: { id: initialProd.id }
                })
            }
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const id = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/productions/${id}`,
                payload: { title: { nl: 'Unauthorized' } }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('DELETE /api/archive/productions/:id', () => {
        it('should return 401 when no token provided', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/archive/productions/00000000-0000-0000-0000-000000000000'
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
                url: `/api/archive/productions/${production.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)

            const dbRecord = await app.prisma.production.findUnique({
                where: { id: production.id }
            })
            expect(dbRecord).toBeNull()
        })
    })
})
