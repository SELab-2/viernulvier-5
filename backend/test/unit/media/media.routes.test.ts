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

    it('GET /api/archive/media/galleries should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/media/galleries' })
        expect(response.statusCode).toBe(200)
    })

    it('GET /api/archive/media/items should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/media/items' })
        expect(response.statusCode).toBe(200)
    })

    it('GET /api/archive/media/items/crops should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/media/items/crops' })
        expect(response.statusCode).toBe(200)
    })

    describe('GET /api/archive/media/galleries/:id', () => {
        it('should return a gallery by ID with 200 OK', async () => {
            const gallery = await app.prisma.gallery.create({
                data: { name: 'Test Gallery' }
            })
            const response = await app.inject({ method: 'GET', url: `/api/archive/media/galleries/${gallery.id}` })
            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(gallery.id)
            await app.prisma.gallery.delete({ where: { id: gallery.id } })
        })

        it('should return 404 for non-existent gallery', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/archive/media/galleries/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/archive/media/items/:id', () => {
        it('should return a media item by ID with 200 OK', async () => {
            const item = await app.prisma.item.create({
                data: { type: 'image', original_filename: 'test.jpg' }
            })
            const response = await app.inject({ method: 'GET', url: `/api/archive/media/items/${item.id}` })
            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(item.id)
            await app.prisma.item.delete({ where: { id: item.id } })
        })

        it('should return 404 for non-existent item', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/archive/media/items/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('GET /api/archive/media/items/crops/:id', () => {
        it('should return a crop by ID with 200 OK', async () => {
            const crop = await app.prisma.crop.create({
                data: { name: 'test-crop', url: 'http://test.com/crop.jpg' }
            })
            const response = await app.inject({ method: 'GET', url: `/api/archive/media/items/crops/${crop.id}` })
            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body.id).toBe(crop.id)
            await app.prisma.crop.delete({ where: { id: crop.id } })
        })

        it('should return 404 for non-existent crop', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/archive/media/items/crops/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
        })
    })
})
