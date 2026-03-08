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

    describe('POST /api/archive/genres', () => {
        it('should create a genre and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/genres',
                headers: { authorization: `Bearer ${token}` },
                payload: { type: 'test-create', name: { nl: 'New Genre' } }
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.name.nl).toBe('New Genre')

            await app.prisma.genre.delete({ where: { id: body.id } })
        })
    })

    describe('PUT /api/archive/genres/:id', () => {
        it('should update a genre and clean up', async () => {
            const genre = await app.prisma.genre.create({
                data: { name: { nl: 'Original Name' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/genres/${genre.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { name: { nl: 'Updated Name' } }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.name.nl).toBe('Updated Name')

            await app.prisma.genre.delete({ where: { id: genre.id } })
        })
    })

    describe('DELETE /api/archive/genres/:id', () => {
        it('should delete a genre', async () => {
            const genre = await app.prisma.genre.create({
                data: { name: { nl: 'To Delete' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/archive/genres/${genre.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.genre.findUnique({ where: { id: genre.id } })
            expect(dbRecord).toBeNull()
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

    describe('POST /api/archive/tags', () => {
        it('should create a tag and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/tags',
                headers: { authorization: `Bearer ${token}` },
                payload: { code: 'new-tag', name: { nl: 'New Tag' } }
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.name.nl).toBe('New Tag')

            await app.prisma.tag.delete({ where: { id: body.id } })
        })
    })

    describe('PUT /api/archive/tags/:id', () => {
        it('should update a tag and clean up', async () => {
            const tag = await app.prisma.tag.create({
                data: { name: { nl: 'Original Tag' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PUT',
                url: `/api/archive/tags/${tag.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { name: { nl: 'Updated Tag' } }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.name.nl).toBe('Updated Tag')

            await app.prisma.tag.delete({ where: { id: tag.id } })
        })
    })

    describe('DELETE /api/archive/tags/:id', () => {
        it('should delete a tag', async () => {
            const tag = await app.prisma.tag.create({
                data: { name: { nl: 'To Delete Tag' } }
            })

            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/archive/tags/${tag.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.tag.findUnique({ where: { id: tag.id } })
            expect(dbRecord).toBeNull()
        })
    })
})
