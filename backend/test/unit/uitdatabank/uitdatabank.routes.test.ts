import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

describe('UIT Databank Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/archive/uitdatabank/keywords', () => {
        it('should return a paginated list of keywords with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/uitdatabank/keywords',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
        })

        it('should filter keywords by search term', async () => {
             // 1. Create a keyword directly in DB
             const keyword = await app.prisma.uitdatabank_keywords.create({
                data: {
                    name: 'TestKeywordUnique'
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/uitdatabank/keywords',
                query: { search: 'TestKeywordUnique' }
            })

            const body = JSON.parse(response.payload)
            expect(response.statusCode).toBe(200)
            expect(body.data.length).toBeGreaterThanOrEqual(1)
            expect(body.data[0].name).toBe('TestKeywordUnique')

            // Cleanup
            await app.prisma.uitdatabank_keywords.delete({
                where: { id: keyword.id }
            })
        })
    })

    describe('GET /api/archive/uitdatabank/themes', () => {
        it('should return a paginated list of themes with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/uitdatabank/themes',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(Array.isArray(body.data)).toBe(true)
        })
    })

    describe('GET /api/archive/uitdatabank/types', () => {
        it('should return a paginated list of types with 200 OK', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/archive/uitdatabank/types',
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
