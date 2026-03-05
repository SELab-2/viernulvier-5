import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

/**
 * Integration tests for Archive Routes.
 * Tests the full chain: Route -> Controller -> Service -> Repository.
 */
describe('Archive Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/archive/productions', () => {
        it('should return a paginated list with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/productions',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
            
            // Meta validation
            expect(body.meta.page).toBe(1)
            expect(body.meta.limit).toBe(10)
            expect(typeof body.meta.total).toBe('number')
        })

        it('should return 400 Bad Request for invalid pagination params', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/productions',
                query: { page: '0' } // Should be at least 1 according to Zod schema
            })

            expect(response.statusCode).toBe(400)
            
            const body = JSON.parse(response.payload)
            expect(body.error).toBe('Bad Request')
        })

        it('should work with a search query', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/productions',
                query: { search: 'test-production' }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/events', () => {
        it('should return a paginated list of events with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.meta.page).toBe(1)
        })

        it('should filter events by productionId', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/events',
                query: { productionId: fakeId }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/genres', () => {
        it('should return a paginated list of genres with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/genres',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('GET /api/archive/locations', () => {
        it('should return a paginated list of locations with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/locations',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('GET /api/archive/tags', () => {
        it('should return a paginated list of tags with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/tags',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
        })
    })
})
