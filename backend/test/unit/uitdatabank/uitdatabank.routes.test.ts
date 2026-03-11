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
             const keyword = await app.prisma.uitdatabank_keyword.create({
                data: {
                    name: 'TestKeywordUnique'
                }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/archive/uitdatabank/keywords',
                    query: { search: 'TestKeywordUnique' }
                })

                const body = JSON.parse(response.payload)
                expect(response.statusCode).toBe(200)
                expect(body.data.length).toBeGreaterThanOrEqual(1)
                expect(body.data[0].name).toBe('TestKeywordUnique')
            } finally {
                await app.prisma.uitdatabank_keyword.delete({
                    where: { id: keyword.id }
                })
            }
        })
    })

    describe('GET /api/archive/uitdatabank/keywords/:id', () => {
        it('should return a keyword by ID with 200 OK', async () => {
            const keyword = await app.prisma.uitdatabank_keyword.create({
                data: { name: 'Test Keyword' }
            })
            try {
                const response = await app.inject({ method: 'GET', url: `/api/archive/uitdatabank/keywords/${keyword.id}` })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.id).toBe(keyword.id)
            } finally {
                await app.prisma.uitdatabank_keyword.delete({ where: { id: keyword.id } })
            }
        })

        it('should return 404 for non-existent keyword', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/archive/uitdatabank/keywords/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
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

    describe('GET /api/archive/uitdatabank/themes/:id', () => {
        it('should return a theme by ID with 200 OK', async () => {
            const theme = await app.prisma.uitdatabank_theme.create({
                data: { name: 'Test Theme' }
            })
            try {
                const response = await app.inject({ method: 'GET', url: `/api/archive/uitdatabank/themes/${theme.id}` })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.id).toBe(theme.id)
            } finally {
                await app.prisma.uitdatabank_theme.delete({ where: { id: theme.id } })
            }
        })

        it('should return 404 for non-existent theme', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/archive/uitdatabank/themes/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
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

    describe('GET /api/archive/uitdatabank/types/:id', () => {
        it('should return a type by ID with 200 OK', async () => {
            const type = await app.prisma.uitdatabank_type.create({
                data: { name: 'Test Type' }
            })
            try {
                const response = await app.inject({ method: 'GET', url: `/api/archive/uitdatabank/types/${type.id}` })
                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.id).toBe(type.id)
            } finally {
                await app.prisma.uitdatabank_type.delete({ where: { id: type.id } })
            }
        })

        it('should return 404 for non-existent type', async () => {
            const response = await app.inject({ method: 'GET', url: '/api/archive/uitdatabank/types/00000000-0000-0000-0000-000000000000' })
            expect(response.statusCode).toBe(404)
        })
    })
})
