import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'
import { Role } from '../../../src/domain/role.js'

describe('Blogs Routes', () => {
    let app: FastifyInstance
    const title = { nl: 'Test Blog', en: 'Test Blog' }

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
            expect(body.meta).toHaveProperty('total')
        })

        it('should search blogs by title, content, and created date', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const production = await app.prisma.production.create({ data: {} })

            try {
                const titleBlogResponse = await app.inject({
                    method: 'POST',
                    url: '/api/v1/archive/blogs',
                    headers: { authorization: `Bearer ${token}` },
                    payload: {
                        title: JSON.stringify({ nl: 'Unieke blogtitel', en: 'Unique blog title' }),
                        content: { nl: JSON.stringify({ ops: [{ insert: 'Beschrijving alpha' }] }) },
                        productionIds: [production.id],
                    },
                })
                const titleBlog = JSON.parse(titleBlogResponse.payload).data

                const contentBlogResponse = await app.inject({
                    method: 'POST',
                    url: '/api/v1/archive/blogs',
                    headers: { authorization: `Bearer ${token}` },
                    payload: {
                        title: JSON.stringify({ nl: 'Andere titel', en: 'Other title' }),
                        content: { nl: JSON.stringify({ ops: [{ insert: 'Beschrijving beta' }] }) },
                        productionIds: [production.id],
                    },
                })
                const contentBlog = JSON.parse(contentBlogResponse.payload).data

                await app.prisma.blog.update({
                    where: { id: contentBlog.id },
                    data: { createdAt: new Date('2026-04-22T10:00:00.000Z') },
                })

                const titleSearchResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/blogs?search=Unieke%20blogtitel',
                })
                expect(titleSearchResponse.statusCode).toBe(200)
                expect(JSON.parse(titleSearchResponse.payload).data.map((item: { id: string }) => item.id)).toContain(titleBlog.id)

                const contentSearchResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/blogs?search=beta',
                })
                expect(contentSearchResponse.statusCode).toBe(200)
                expect(JSON.parse(contentSearchResponse.payload).data.map((item: { id: string }) => item.id)).toContain(contentBlog.id)

                const dateSearchResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/blogs?search=22/04/2026',
                })
                expect(dateSearchResponse.statusCode).toBe(200)
                expect(JSON.parse(dateSearchResponse.payload).data.map((item: { id: string }) => item.id)).toContain(contentBlog.id)
            } finally {
                await app.prisma.blog_production.deleteMany({ where: { production_id: production.id } })
                await app.prisma.production.delete({ where: { id: production.id } })
            }
        })
    })

    describe('POST /api/v1/archive/blogs', () => {
        it('should create a blog with 201 Created and links', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const production = await app.prisma.production.create({ data: {} })
            const payload = {
                title,
                content: { text: 'This is a test blog content.' },
                productionIds: [production.id]
            }

            try {
                const response = await app.inject({
                    method: 'POST',
                    url: '/api/v1/archive/blogs',
                    headers: { authorization: `Bearer ${token}` },
                    payload
                })

                expect(response.statusCode).toBe(201)
                const body = JSON.parse(response.payload)
                expect(body.data.title).toEqual(payload.title)
                expect(body.data.content).toEqual(payload.content)
                expect(body.data.productions).toEqual(payload.productionIds)
                expect(body.data).toHaveProperty('id')
                expect(body.links).toHaveProperty('self')
            } finally {
                await app.prisma.blog_production.deleteMany({ where: { production_id: production.id } })
                await app.prisma.production.delete({ where: { id: production.id } })
            }
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/blogs',
                payload: { title, content: { text: 'Test' }, productionIds: ['00000000-0000-0000-0000-000000000001'] }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('GET /api/v1/archive/blogs/:id', () => {
        it('should return a blog by ID with links', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const production = await app.prisma.production.create({ data: {} })
            
            // Create a blog first
            try {
                const postResponse = await app.inject({
                    method: 'POST',
                    url: '/api/v1/archive/blogs',
                    headers: { authorization: `Bearer ${token}` },
                    payload: { title, content: { text: 'Content' }, productionIds: [production.id] }
                })
                const created = JSON.parse(postResponse.payload)

                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/archive/blogs/${created.data.id}`,
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(created.data.id)
                expect(body.data.title).toEqual(title)
                expect(body.data.productions).toEqual([production.id])
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.blog_production.deleteMany({ where: { production_id: production.id } })
                await app.prisma.production.delete({ where: { id: production.id } })
            }
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
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const productionA = await app.prisma.production.create({ data: {} })
            const productionB = await app.prisma.production.create({ data: {} })
            
            try {
                // Create
                const postResponse = await app.inject({
                    method: 'POST',
                    url: '/api/v1/archive/blogs',
                    headers: { authorization: `Bearer ${token}` },
                    payload: { title: { nl: 'Old Title', en: 'Old Title' }, content: { text: 'Old Content' }, productionIds: [productionA.id] }
                })
                const created = JSON.parse(postResponse.payload)

                // Update
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/blogs/${created.data.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: { title: { nl: 'New Title', en: 'New Title' }, productionIds: [productionB.id] }
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.title).toEqual({ nl: 'New Title', en: 'New Title' })
                expect(body.data.content).toEqual({ text: 'Old Content' })
                expect(body.data.productions).toEqual([productionB.id])
                expect(body.data).toHaveProperty('links')
            } finally {
                await app.prisma.blog_production.deleteMany({ where: { production_id: productionA.id } })
                await app.prisma.blog_production.deleteMany({ where: { production_id: productionB.id } })
                await app.prisma.production.deleteMany({ where: { id: { in: [productionA.id, productionB.id] } } })
            }
        })

        it('should return 404 for non-existent blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const uuid = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/archive/blogs/${uuid}`,
                headers: { authorization: `Bearer ${token}` },
                    payload: { title: { nl: 'New Title', en: 'New Title' } }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/blogs/:id', () => {
        it('should delete a blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const production = await app.prisma.production.create({ data: {} })
            
            try {
                // Create
                const postResponse = await app.inject({
                    method: 'POST',
                    url: '/api/v1/archive/blogs',
                    headers: { authorization: `Bearer ${token}` },
                    payload: { title: { nl: 'To Delete', en: 'To Delete' }, content: { text: 'Content' }, productionIds: [production.id] }
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
            } finally {
                await app.prisma.blog_production.deleteMany({ where: { production_id: production.id } })
                await app.prisma.production.delete({ where: { id: production.id } })
            }
        })

        it('should return 404 for non-existent blog', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
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
