import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Spaces Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    it('GET /api/archive/spaces should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/spaces' })
        expect(response.statusCode).toBe(200)
    })

    describe('GET /api/archive/spaces/:id', () => {
        it('should return a space by ID with 200 OK', async () => {
            const space = await app.prisma.space.create({
                data: {
                    name: { nl: 'Test Space' }
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/spaces/${space.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(space.id)

            await app.prisma.space.delete({ where: { id: space.id } })
        })

        it('should return 404 for non-existent space', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/spaces/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
