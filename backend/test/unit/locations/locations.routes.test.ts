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
})
