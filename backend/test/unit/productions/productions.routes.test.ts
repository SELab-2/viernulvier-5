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
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body.meta.page).toBe(1)
        })
    })

    describe('POST /api/archive/productions', () => {
        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/productions',
                payload: { title: { nl: 'Unauthorized Production' } }
            })

            expect(response.statusCode).toBe(401)
        })

        it('should create a production in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = { 
                title: { nl: 'Integration Test Production' },
                artist: { nl: 'Test Artist' }
            }

            // 1. Create via API
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/productions',
                headers: {
                    authorization: `Bearer ${token}`
                },
                payload
            })

            expect(response.statusCode).toBe(201)
            const created = JSON.parse(response.payload)
            expect(created.title.nl).toBe(payload.title.nl)

            // 2. Verify in DB
            const dbRecord = await app.prisma.production.findUnique({
                where: { id: created.id }
            })
            expect(dbRecord).not.toBeNull()
            expect((dbRecord?.title as any).nl).toBe(payload.title.nl)

            // 3. CLEANUP
            await app.prisma.production.delete({
                where: { id: created.id }
            })
        })
    })

    describe('PUT /api/archive/productions/:id', () => {
        it('should update a production in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            // 1. Pre-create a record directly in DB for testing
            const initialProduction = await app.prisma.production.create({
                data: {
                    title: { nl: 'Initial Title' },
                    artist: { nl: 'Initial Artist' }
                }
            })

            const updatePayload = { title: { nl: 'Updated Title' } }

            // 2. Update via API
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/productions/${initialProduction.id}`,
                headers: {
                    authorization: `Bearer ${token}`
                },
                payload: updatePayload
            })

            expect(response.statusCode).toBe(200)
            const updated = JSON.parse(response.payload)
            expect(updated.title.nl).toBe(updatePayload.title.nl)

            // 3. Verify in DB
            const dbRecord = await app.prisma.production.findUnique({
                where: { id: initialProduction.id }
            })
            expect((dbRecord?.title as any).nl).toBe(updatePayload.title.nl)

            // 4. CLEANUP
            await app.prisma.production.delete({
                where: { id: initialProduction.id }
            })
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const id = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/productions/${id}`,
                payload: { title: 'Updated Title' }
            })

            expect(response.statusCode).toBe(401)
        })
    })
})
