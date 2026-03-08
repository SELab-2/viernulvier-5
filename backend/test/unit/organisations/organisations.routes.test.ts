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

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/archive/organisations/${organisation.id}`
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.id).toBe(organisation.id)
            } finally {
                await app.prisma.organisations.delete({ where: { id: organisation.id } })
            }
        })

        it('should return 404 for non-existent organisation', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/organisations/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/archive/organisations', () => {
        it('should return 401 when no token provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/organisations',
                payload: { name: 'Unauthorized' }
            })
            expect(response.statusCode).toBe(401)
        })

        it('should create an organisation and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/organisations',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: 'Test New Org' }
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.name).toBe('Test New Org')

            await app.prisma.organisations.delete({ where: { id: body.id } })
        })
    })

    describe('PUT /api/archive/organisations/:id', () => {
        it('should return 401 when no token provided', async () => {
            const response = await app.inject({
                method: 'PUT',
                url: '/api/archive/organisations/00000000-0000-0000-0000-000000000000',
                payload: { name: 'Unauthorized' }
            })
            expect(response.statusCode).toBe(401)
        })

        it('should update an organisation and clean up', async () => {
            const organisation = await app.prisma.organisations.create({
                data: { name: 'Original Name' }
            })

            try {
                const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
                const response = await app.inject({
                    method: 'PUT',
                    url: `/api/archive/organisations/${organisation.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: { name: 'Updated Name' }
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.name).toBe('Updated Name')
            } finally {
                await app.prisma.organisations.delete({ where: { id: organisation.id } })
            }
        })
    })

    describe('DELETE /api/archive/organisations/:id', () => {
        it('should return 401 when no token provided', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/archive/organisations/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(401)
        })

        it('should delete an organisation', async () => {
            const organisation = await app.prisma.organisations.create({
                data: { name: 'To Be Deleted' }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/archive/organisations/${organisation.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)

            const dbRecord = await app.prisma.organisations.findUnique({
                where: { id: organisation.id }
            })
            expect(dbRecord).toBeNull()
        })
    })
})
