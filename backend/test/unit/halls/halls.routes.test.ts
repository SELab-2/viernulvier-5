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

    it('GET /api/v1/archive/halls should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/v1/archive/halls' })
        expect(response.statusCode).toBe(200)
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
                expect(body.id).toBe(hall.id)
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
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/halls',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: { nl: 'New Hall POST' } }
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.name.nl).toBe('New Hall POST')

            await app.prisma.hall.delete({ where: { id: body.id } })
        })
    })

    describe('PUT /api/v1/archive/halls/:id', () => {
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
                expect(body.name.nl).toBe('Updated Hall')
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
