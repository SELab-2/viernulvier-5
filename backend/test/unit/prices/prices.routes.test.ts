import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Prices Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/archive/prices', () => {
        it('should return a paginated list of prices with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/prices',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.meta.page).toBe(1)
            expect(body.meta.limit).toBe(10)
        })

        it('should work with a search query', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/prices',
                query: { search: 'standard' }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/prices/ranks', () => {
        it('should return a paginated list of price ranks with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/prices/ranks',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
            expect(body.meta.page).toBe(1)
        })

        it('should work with a search query for ranks', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/prices/ranks',
                query: { search: 'rank' }
            })

            expect(response.statusCode).toBe(200)
            const body = JSON.parse(response.payload)
            expect(body).toHaveProperty('data')
        })
    })
})
