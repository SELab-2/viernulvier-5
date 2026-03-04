import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Halls Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    it('GET /api/archive/halls should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/halls' })
        expect(response.statusCode).toBe(200)
    })
})
