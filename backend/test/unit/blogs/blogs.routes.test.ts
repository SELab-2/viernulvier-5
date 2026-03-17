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

    describe('GET /api/v1/archive/blogs', () => {
        it('should return an empty list initially with paginated structure', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/blogs',
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.data.length).toBe(0)
        })
    })

    describe('POST /api/v1/archive/blogs', () => {
        it('should create a blog with 201 Created and links', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const payload = {
                title: 'Test Blog',
                content: 'This is a test blog content.'
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/blogs',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.data.title).toBe(payload.title)
            expect(body.data.content).toBe(payload.content)
            expect(body.data).toHaveProperty('id')
            expect(body.links).toHaveProperty('self')
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/blogs',
                payload: { title: 'Test', content: 'Test' }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('GET /api/v1/archive/blogs/:id', () => {
        it('should return a blog by ID with links', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            // Create a blog first
            const postResponse = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/blogs',
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'Find Me', content: 'Content' }
            })
            const created = JSON.parse(postResponse.payload)

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/archive/blogs/${created.data.id}`,
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.data.id).toBe(created.data.id)
            expect(body.data.title).toBe('Find Me')
            expect(body.data).toHaveProperty('links')
            expect(body.data.links).toHaveProperty('self')
        })

        it('should return 404 for non-existent ID', async () => {
            const uuid = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/archive/blogs/${uuid}`,
            })

            expect(response.statusCode).toBe(404)
        })
    })

    describe('PATCH /api/v1/archive/blogs/:id', () => {
        it('should update a blog and return new structure', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            // Create
            const postResponse = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/blogs',
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'Old Title', content: 'Old Content' }
            })
            const created = JSON.parse(postResponse.payload)

            // Update
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/archive/blogs/${created.data.id}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'New Title' }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.data.title).toBe('New Title')
            expect(body.data.content).toBe('Old Content')
            expect(body.data).toHaveProperty('links')
        })

        it('should return 404 for non-existent blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const uuid = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/archive/blogs/${uuid}`,
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'New Title' }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/blogs/:id', () => {
        it('should delete a blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            
            // Create
            const postResponse = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/blogs',
                headers: { authorization: `Bearer ${token}` },
                payload: { title: 'To Delete', content: 'Content' }
            })
            const created = JSON.parse(postResponse.payload)

            // Delete
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/blogs/${created.data.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)

            // Verify 404
            const getResponse = await app.inject({
                method: 'GET',
                url: `/api/v1/archive/blogs/${created.data.id}`,
            })
            expect(getResponse.statusCode).toBe(404)
        })

        it('should return 404 for non-existent blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const uuid = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/blogs/${uuid}`,
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
