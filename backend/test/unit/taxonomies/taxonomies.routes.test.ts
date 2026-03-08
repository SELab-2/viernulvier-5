import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Taxonomies Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/archive/genres', () => {
        it('should return a paginated list of genres with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/genres',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/genres/:id', () => {
        it('should return a genre by ID with 200 OK', async () => {
            const genre = await app.prisma.genre.create({
                data: {
                    name: { nl: 'Test Genre' },
                    type: 'test-type'
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/genres/${genre.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(genre.id)

            await app.prisma.genre.delete({ where: { id: genre.id } })
        })

        it('should return 404 for non-existent genre', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/genres/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/archive/tags', () => {
        it('should return a paginated list of tags with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/tags',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/tags/:id', () => {
        it('should return a tag by ID with 200 OK', async () => {
            const tag = await app.prisma.tag.create({
                data: {
                    name: { nl: 'Test Tag' },
                    code: 'test-code'
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/tags/${tag.id}`
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(tag.id)

            await app.prisma.tag.delete({ where: { id: tag.id } })
        })

        it('should return 404 for non-existent tag', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/tags/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
