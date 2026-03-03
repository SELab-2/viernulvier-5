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
})
