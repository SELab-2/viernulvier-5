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

    describe('GET /api/v1/archive/locations', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/locations',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(body.meta.page).toBe(1)
        })

        it('should work with a search query', async () => {
            const location = await app.prisma.location.create({
                data: { name: { nl: 'Searchable Location' }, city: 'Search City' }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/locations',
                    query: { search: 'Searchable' }
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.length).toBeGreaterThanOrEqual(1)
                expect(body.data[0].name.nl).toBe('Searchable Location')
            } finally {
                await app.prisma.location.delete({ where: { id: location.id } })
            }
        })
    })

    describe('GET /api/v1/archive/locations/:id', () => {
        it('should return a location by ID with 200 OK', async () => {
            const location = await app.prisma.location.create({
                data: {
                    name: { nl: 'Test Location' },
                    city: 'Test City'
                }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/archive/locations/${location.id}`
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(location.id)
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.location.delete({ where: { id: location.id } })
            }
        })

        it('should return 404 for non-existent location', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/locations/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/v1/archive/locations', () => {
        it('should create a location and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = { 
                name: { nl: 'New Location' },
                city: 'Test City POST' 
            }
            
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/locations',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.data.city).toBe('Test City POST')
            expect(body.links).toHaveProperty('self')

            await app.prisma.location.delete({ where: { id: body.data.id } })
        })
    })

    describe('PATCH /api/v1/archive/locations/:id', () => {
        it('should update a location and clean up', async () => {
            const location = await app.prisma.location.create({
                data: { city: 'Original City' }
            })

            try {
                const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/locations/${location.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: { city: 'Updated City' }
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.city).toBe('Updated City')
                expect(body.data).toHaveProperty('links')
            } finally {
                await app.prisma.location.delete({ where: { id: location.id } })
            }
        })

        it('should return 404 for non-existent location', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/locations/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { city: 'Non-existent' }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/locations/:id', () => {
        it('should delete a location', async () => {
            const location = await app.prisma.location.create({
                data: { city: 'To Delete' }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/locations/${location.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.location.findUnique({ where: { id: location.id } })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent location', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/locations/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
