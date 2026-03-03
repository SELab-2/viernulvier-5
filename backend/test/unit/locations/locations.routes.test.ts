import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Locations Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/archive/locations', () => {
        it('should return a paginated list of locations with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/locations',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/locations/halls', () => {
        it('should return a paginated list of halls with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/locations/halls',
            })

            const body = JSON.parse(response.payload)
            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/locations/spaces', () => {
        it('should return a paginated list of spaces with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/locations/spaces',
            })

            const body = JSON.parse(response.payload)
            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
        })
    })
})
