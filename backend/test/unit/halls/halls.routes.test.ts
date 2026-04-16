import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Halls Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/v1/archive/halls', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/halls',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(body.meta.page).toBe(1)
        })

        it('should work with a search query', async () => {
            const hall = await app.prisma.hall.create({
                data: { name: { nl: 'Searchable Hall' } }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/halls',
                    query: { search: 'Searchable' }
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.length).toBeGreaterThanOrEqual(1)
                expect(body.data[0].name.nl).toBe('Searchable Hall')
            } finally {
                await app.prisma.hall.delete({ where: { id: hall.id } })
            }
        })
    })

    describe('GET /api/v1/archive/halls/:id', () => {
        it('should return a hall by ID with 200 OK', async () => {
            const hall = await app.prisma.hall.create({
                data: {
                    name: { nl: 'Test Hall' }
                }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/archive/halls/${hall.id}`
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(hall.id)
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.hall.delete({ where: { id: hall.id } })
            }
        })

        it('should return 404 for non-existent hall', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/halls/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/v1/archive/halls', () => {
        it('should create a hall and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = { 
                name: { nl: 'New Hall POST' }
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/halls',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.data.name.nl).toBe('New Hall POST')
            expect(body.links).toHaveProperty('self')

            await app.prisma.hall.delete({ where: { id: body.data.id } })
        })
    })

    describe('PATCH /api/v1/archive/halls/:id', () => {
        it('should update a hall and clean up', async () => {
            const hall = await app.prisma.hall.create({
                data: { name: { nl: 'Original Hall' } }
            })

            try {
                const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/halls/${hall.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: { name: { nl: 'Updated Hall' } }
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.name.nl).toBe('Updated Hall')
                expect(body.data).toHaveProperty('links')
            } finally {
                await app.prisma.hall.delete({ where: { id: hall.id } })
            }
        })

        it('should return 404 for non-existent hall', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/halls/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: { nl: 'Non-existent' } }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/halls/:id', () => {
        it('should delete a hall', async () => {
            const hall = await app.prisma.hall.create({
                data: { name: { nl: 'To Delete' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/halls/${hall.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.hall.findUnique({ where: { id: hall.id } })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent hall', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/halls/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
