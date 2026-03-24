import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Events Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/v1/archive/events', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/events',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(body.meta.page).toBe(1)
        })
    })

    describe('GET /api/v1/archive/events/:id', () => {
        it('should return an event by ID with 200 OK', async () => {
            const event = await app.prisma.event.create({
                data: {
                    starts_at: new Date(),
                    info: { nl: 'Event by ID Test' }
                }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/archive/events/${event.id}`,
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(event.id)
                expect(body.data.info.nl).toBe('Event by ID Test')
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.event.delete({
                    where: { id: event.id }
                })
            }
        })

        it('should return 404 Not Found for non-existent ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/archive/events/${nonExistentId}`,
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.payload)
            expect(body.message).toBe('Event not found')
        })
    })

    describe('POST /api/v1/archive/events', () => {
        it('should create an event in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = { 
                starts_at: new Date().toISOString(),
                info: { nl: 'Test Info' }
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/events',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            const created = body.data

            const dbRecord = await app.prisma.event.findUnique({
                where: { id: created.id }
            })
            expect(dbRecord).not.toBeNull()
            expect(body.links).toHaveProperty('self')

            await app.prisma.event.delete({
                where: { id: created.id }
            })
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/events',
                payload: { starts_at: new Date().toISOString() }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('PATCH /api/v1/archive/events/:id', () => {
        it('should update an event in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            const initialEvent = await app.prisma.event.create({
                data: {
                    starts_at: new Date(),
                    info: { nl: 'Initial Info' }
                }
            })

            const updatePayload = { info: { nl: 'Updated Info' } }

            try {
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/events/${initialEvent.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: updatePayload
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                const updated = body.data
                expect(updated.info.nl).toBe(updatePayload.info.nl)
                expect(updated.links).toHaveProperty('self')
            } finally {
                await app.prisma.event.delete({
                    where: { id: initialEvent.id }
                })
            }
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const id = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/archive/events/${id}`,
                payload: { starts_at: new Date() }
            })

            expect(response.statusCode).toBe(401)
        })

        it('should return 404 for non-existent event', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/events/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { info: { nl: 'Non-existent' } }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/events/:id', () => {
        it('should return 401 when no token provided', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/events/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(401)
        })

        it('should delete an event', async () => {
            const event = await app.prisma.event.create({
                data: { starts_at: new Date() }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/events/${event.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)

            const dbRecord = await app.prisma.event.findUnique({
                where: { id: event.id }
            })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent event', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/events/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/v1/archive/events/prices', () => {
        it('should return a paginated list of event prices with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/events/prices',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('GET /api/v1/archive/events/prices/:id', () => {
        it('should return an event price by ID with 200 OK', async () => {
            const price = await app.prisma.event_price.create({
                data: {
                    amount: '10.50',
                    available: 100
                }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/archive/events/prices/${price.id}`
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(price.id)
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.event_price.delete({ where: { id: price.id } })
            }
        })

        it('should return 404 for non-existent price', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/events/prices/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
