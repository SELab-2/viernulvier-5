import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Events Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/archive/events', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body.meta.page).toBe(1)
        })
    })

    describe('GET /api/archive/events/prices', () => {
        it('should return a paginated list of event prices with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events/prices',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
        })

        it('should work with a search query for event prices', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events/prices',
                query: { search: '10' }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/events/statuses', () => {
        it('should return a paginated list of event statuses with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events/statuses',
                query: { page: '1', limit: '5' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
        })

        it('should work with a search query for statuses', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events/statuses',
                query: { search: 'beschikbaar' }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
        })
    })
})
