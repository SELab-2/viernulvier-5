import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Media Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/v1/archive/media/galleries', () => {
        it('should return 200 with paginated structure', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/v1/archive/media/galleries' })
            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
        })
    })

    describe('GET /api/v1/archive/media/items', () => {
        it('should return 200 with paginated structure', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/v1/archive/media/items' })
            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
        })
    })

    describe('GET /api/v1/archive/media/items/crops', () => {
        it('should return 200 with paginated structure', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/v1/archive/media/items/crops' })
            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
        })
    })

    describe('GET /api/v1/archive/media/galleries/:id', () => {
        it('should return a gallery by ID with 200 OK and links', async () => {
            const gallery = await app.prisma.gallery.create({
                data: { name: 'Test Gallery' }
            })
            try {
                const response = await app.inject({ method: 'GET', url: `/api/v1/archive/media/galleries/${gallery.id}` })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(gallery.id)
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.gallery.delete({ where: { id: gallery.id } })
            }
        })

        it('should return 404 for non-existent gallery', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/v1/archive/media/galleries/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/v1/archive/media/items/:id', () => {
        it('should return a media item by ID with 200 OK and links', async () => {
            const item = await app.prisma.item.create({
                data: { type: 'image', original_filename: 'test.jpg' }
            })
            try {
                const response = await app.inject({ method: 'GET', url: `/api/v1/archive/media/items/${item.id}` })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(item.id)
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.item.delete({ where: { id: item.id } })
            }
        })

        it('should return 404 for non-existent item', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/v1/archive/media/items/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/v1/archive/media/items/crops/:id', () => {
        it('should return a crop by ID with 200 OK and links', async () => {
            const crop = await app.prisma.crop.create({
                data: { name: 'test-crop', url: 'http://test.com/crop.jpg' }
            })
            try {
                const response = await app.inject({ method: 'GET', url: `/api/v1/archive/media/items/crops/${crop.id}` })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(crop.id)
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.crop.delete({ where: { id: crop.id } })
            }
        })

        it('should return 404 for non-existent crop', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/v1/archive/media/items/crops/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/v1/archive/media/galleries', () => {
        it('should create a gallery and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/media/galleries',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: 'New Gallery POST' }
            })
            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.data.name).toBe('New Gallery POST')
            expect(body.links).toHaveProperty('self')
            await app.prisma.gallery.delete({ where: { id: body.data.id } })
        })
    })

    describe('PATCH /api/v1/archive/media/galleries/:id', () => {
        it('should update a gallery and clean up', async () => {
            const gallery = await app.prisma.gallery.create({ data: { name: 'Old Name' } })
            try {
                const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/media/galleries/${gallery.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: { name: 'Updated Name' }
                })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.name).toBe('Updated Name')
            } finally {
                await app.prisma.gallery.delete({ where: { id: gallery.id } })
            }
        })

        it('should return 404 for non-existent gallery', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/media/galleries/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: 'Updated Name' }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/media/galleries/:id', () => {
        it('should delete a gallery', async () => {
            const gallery = await app.prisma.gallery.create({ data: { name: 'To Delete' } })
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/media/galleries/${gallery.id}`,
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.gallery.findUnique({ where: { id: gallery.id } })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent gallery', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/media/galleries/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/v1/archive/media/items', () => {
        it('should create an item and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/media/items',
                headers: { authorization: `Bearer ${token}` },
                payload: { type: 'image', original_filename: 'new.jpg' }
            })
            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.data.original_filename).toBe('new.jpg')
            expect(body.links).toHaveProperty('self')
            await app.prisma.item.delete({ where: { id: body.data.id } })
        })
    })

    describe('PATCH /api/v1/archive/media/items/:id', () => {
        it('should update an item and clean up', async () => {
            const item = await app.prisma.item.create({ data: { type: 'image', original_filename: 'old.jpg' } })
            try {
                const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/media/items/${item.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: { original_filename: 'updated.jpg' }
                })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.original_filename).toBe('updated.jpg')
            } finally {
                await app.prisma.item.delete({ where: { id: item.id } })
            }
        })

        it('should return 404 for non-existent item', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/media/items/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { original_filename: 'updated.jpg' }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/media/items/:id', () => {
        it('should delete an item', async () => {
            const item = await app.prisma.item.create({ data: { type: 'image', original_filename: 'to-delete.jpg' } })
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/media/items/${item.id}`,
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.item.findUnique({ where: { id: item.id } })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent item', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/media/items/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/v1/archive/media/items/crops', () => {
        it('should create a crop and clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/media/items/crops',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: 'New Crop', url: 'http://test.com/new.jpg'}
            })
            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            expect(body.data.name).toBe('New Crop')
            expect(body.links).toHaveProperty('self')
            await app.prisma.crop.delete({ where: { id: body.data.id } })
        })
    })

    describe('PATCH /api/v1/archive/media/items/crops/:id', () => {
        it('should update a crop and clean up', async () => {
            const crop = await app.prisma.crop.create({ data: { name: 'Old Crop', url: 'http://test.com/old.jpg' } })
            try {
                const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/media/items/crops/${crop.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: { name: 'Updated Crop' }
                })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.name).toBe('Updated Crop')
            } finally {
                await app.prisma.crop.delete({ where: { id: crop.id } })
            }
        })

        it('should return 404 for non-existent crop', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/media/items/crops/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { name: 'Updated Crop' }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/media/items/crops/:id', () => {
        it('should delete a crop', async () => {
            const crop = await app.prisma.crop.create({ data: { name: 'To Delete', url: 'http://test.com/delete.jpg' } })
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/media/items/crops/${crop.id}`,
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(204)
            const dbRecord = await app.prisma.crop.findUnique({ where: { id: crop.id } })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent crop', async () => {
            const token = app.jwt.sign({ sub: 'admin', role: 'ADMIN' })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/media/items/crops/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
