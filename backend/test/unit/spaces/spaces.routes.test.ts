import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Spaces Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    it('GET /api/archive/spaces should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/spaces' })
        expect(response.statusCode).toBe(200)
    })
})
