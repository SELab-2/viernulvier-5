import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('Organisations Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    it('GET /api/archive/organisations should return 200', async () => {
        const response = await app.inject({ method: 'GET', url: '/api/archive/organisations' })
        expect(response.statusCode).toBe(200)
        
        const body = JSON.parse(response.payload)
        expect(body).toHaveProperty('data')
        expect(body).toHaveProperty('meta')
    })
})
