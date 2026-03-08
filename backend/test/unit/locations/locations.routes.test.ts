import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Locations Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    it('GET /api/archive/locations should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/locations' })
        expect(response.statusCode).toBe(200)
    })

    describe('GET /api/archive/locations/:id', () => {
        it('should return a location by ID with 200 OK', async () => {
            const location = await app.prisma.location.create({
                data: {
                    name: { nl: 'Test Location' },
                    city: 'Test City'
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/locations/${location.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(location.id)

            await app.prisma.location.delete({ where: { id: location.id } })
        })

        it('should return 404 for non-existent location', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/locations/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/archive/locations', () => {
        it('should create a location and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/locations',
                headers: { authorization: `Bearer ${token}` },
                payload: { city: 'Test City POST' }
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.city).toBe('Test City POST')

            await app.prisma.location.delete({ where: { id: body.id } })
        })
    })

    describe('PUT /api/archive/locations/:id', () => {
        it('should update a location and clean up', async () => {
            const location = await app.prisma.location.create({
                data: { city: 'Original City' }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/locations/${location.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { city: 'Updated City' }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.city).toBe('Updated City')

            await app.prisma.location.delete({ where: { id: location.id } })
        })
    })

    describe('DELETE /api/archive/locations/:id', () => {
        it('should delete a location', async () => {
            const location = await app.prisma.location.create({
                data: { city: 'To Delete' }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/archive/locations/${location.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.location.findUnique({ where: { id: location.id } })
            expect(dbRecord).toBeNull()
        })
    })
})
