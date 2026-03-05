import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Taxonomies Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/archive/genres', () => {
        it('should return a paginated list of genres with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/genres',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
        })
    })

    describe('GET /api/archive/tags', () => {
        it('should return a paginated list of tags with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/tags',
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
        })
    })
})
