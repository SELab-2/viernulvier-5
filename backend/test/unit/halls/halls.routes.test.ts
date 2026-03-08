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

    it('GET /api/archive/halls should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/halls' })
        expect(response.statusCode).toBe(200)
    })

    describe('GET /api/archive/halls/:id', () => {
        it('should return a hall by ID with 200 OK', async () => {
            const hall = await app.prisma.hall.create({
                data: {
                    name: { nl: 'Test Hall' }
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/halls/${hall.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(hall.id)

            await app.prisma.hall.delete({ where: { id: hall.id } })
        })

        it('should return 404 for non-existent hall', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/halls/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
