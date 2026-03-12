import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Blogs Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/archive/blogs', () => {
        it('should return an empty list initially', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/blogs',
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(Array.isArray(body)).toBe(true)
            expect(body.length).toBe(0)
        })
    })

    describe('POST /api/archive/blogs', () => {
        it('should create a blog with 201 Created', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = {
                title: 'Test Blog',
                content: 'This is a test blog content.'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/blogs',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.title).toBe(payload.title)
            expect(body.content).toBe(payload.content)
            expect(body).toHaveProperty('id')
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/archive/blogs',
                payload: { title: 'Test', content: 'Test' }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('GET /api/archive/blogs/:id', () => {
        it('should return a blog by ID', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            // Create a blog first
            const postResponse = await app.inject({
                method: 'POST',
                url: '/api/archive/blogs',
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'Find Me', content: 'Content' }
            })
            const created = JSON.parse(postResponse.payload)

            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/blogs/${created.id}`,
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(created.id)
            expect(body.title).toBe('Find Me')
        })

        it('should return 404 for non-existent ID', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'GET',
                url: `/api/archive/blogs/${uuid}`,
            })

            expect(response.statusCode).toBe(404)
        })
    })

    describe('PUT /api/archive/blogs/:id', () => {
        it('should update a blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            // Create
            const postResponse = await app.inject({
                method: 'POST',
                url: '/api/archive/blogs',
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'Old Title', content: 'Old Content' }
            })
            const created = JSON.parse(postResponse.payload)

            // Update
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/archive/blogs/${created.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'New Title' }
            })

            expect(response.statusCode).toBe(200)
            const updated = JSON.parse(response.payload)
            expect(updated.title).toBe('New Title')
            expect(updated.content).toBe('Old Content')
        })

        it('should return 404 for non-existent blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const uuid = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/archive/blogs/${uuid}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'New Title' }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/archive/blogs/:id', () => {
        it('should delete a blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            // Create
            const postResponse = await app.inject({
                method: 'POST',
                url: '/api/archive/blogs',
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'To Delete', content: 'Content' }
            })
            const created = JSON.parse(postResponse.payload)

            // Delete
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/archive/blogs/${created.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)

            // Verify 404
            const getResponse = await app.inject({
                method: 'GET',
                url: `/api/archive/blogs/${created.id}`,
            })
            expect(getResponse.statusCode).toBe(404)
        })

        it('should return 404 for non-existent blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const uuid = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/archive/blogs/${uuid}`,
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
