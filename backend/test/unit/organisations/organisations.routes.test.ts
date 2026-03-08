import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Organisations Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    it('GET /api/archive/organisations should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/organisations' })
        expect(response.statusCode).toBe(200)
        
        const body = JSON.parse(response.payload)
        expect(body).toHaveProperty('data')
        expect(body).toHaveProperty('meta')
    })

    describe('GET /api/archive/organisations/:id', () => {
        it('should return an organisation by ID with 200 OK', async () => {
            const organisation = await app.prisma.organisations.create({
                data: { name: 'Test Organisation' }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/organisations/${organisation.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(organisation.id)

            await app.prisma.organisations.delete({ where: { id: organisation.id } })
        })

        it('should return 404 for non-existent organisation', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/organisations/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
