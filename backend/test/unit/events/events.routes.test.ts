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

    describe('GET /api/archive/events', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body.meta.page).toBe(1)
        })
    })

    describe('GET /api/archive/events/:id', () => {
        it('should return an event by ID with 200 OK', async () => {
            // 1. Pre-create a record directly in DB for testing
            const event = await app.prisma.event.create({
                data: {
                    starts_at: new Date(),
                    info: { nl: 'Event by ID Test' }
                }
            })

            // 2. Fetch via API
            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/events/${event.id}`,
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(event.id)
            expect(body.info.nl).toBe('Event by ID Test')

            // 3. CLEANUP
            await app.prisma.event.delete({
                where: { id: event.id }
            })
        })

        it('should return 404 Not Found for non-existent ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/events/${nonExistentId}`,
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.payload)
            expect(body.message).toBe('Event not found')
        })
    })

    describe('POST /api/archive/events', () => {
        it('should create an event in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = { 
                starts_at: new Date().toISOString(),
                info: { nl: 'Test Info' }
            }

            // 1. Create via API
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/events',
                headers: {
                    authorization: `Bearer ${token}`
                },
                payload
            })

            expect(response.statusCode).toBe(201)
            const created = JSON.parse(response.payload)

            // 2. Verify in DB
            const dbRecord = await app.prisma.event.findUnique({
                where: { id: created.id }
            })
            expect(dbRecord).not.toBeNull()
            expect((dbRecord?.info as any).nl).toBe(payload.info.nl)

            // 3. CLEANUP
            await app.prisma.event.delete({
                where: { id: created.id }
            })
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/events',
                payload: { starts_at: new Date().toISOString() }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('PUT /api/archive/events/:id', () => {
        it('should update an event in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            // 1. Pre-create a record directly in DB for testing
            const initialEvent = await app.prisma.event.create({
                data: {
                    starts_at: new Date(),
                    info: { nl: 'Initial Info' }
                }
            })

            const updatePayload = { info: { nl: 'Updated Info' } }

            // 2. Update via API
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/events/${initialEvent.id}`,
                headers: {
                    authorization: `Bearer ${token}`
                },
                payload: updatePayload
            })

            expect(response.statusCode).toBe(200)
            const updated = JSON.parse(response.payload)
            expect(updated.info.nl).toBe(updatePayload.info.nl)

            // 3. Verify in DB
            const dbRecord = await app.prisma.event.findUnique({
                where: { id: initialEvent.id }
            })
            expect((dbRecord?.info as any).nl).toBe(updatePayload.info.nl)

            // 4. CLEANUP
            await app.prisma.event.delete({
                where: { id: initialEvent.id }
            })
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const id = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/events/${id}`,
                payload: { starts_at: new Date() }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('GET /api/archive/events/prices', () => {
        it('should return a paginated list of event prices with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events/prices',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('GET /api/archive/events/prices/:id', () => {
        it('should return an event price by ID with 200 OK', async () => {
            const price = await app.prisma.event_price.create({
                data: {
                    amount: '10.50',
                    available: 100
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/events/prices/${price.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(price.id)

            await app.prisma.event_price.delete({ where: { id: price.id } })
        })

        it('should return 404 for non-existent price', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events/prices/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
