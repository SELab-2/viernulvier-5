import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'
import { Role } from '../../../src/domain/role.js'

describe('Productions Routes', () => {
    let app: FastifyInstance

    beforeEach(async () => {
        app = await buildTestApp()
    })

    afterEach(async () => {
        await app.close()
    })

    describe('GET /api/v1/archive/productions', () => {
        it('should return a paginated list with 200 OK', async () => {
            // Ensure at least one production exists with a past event
            const production = await app.prisma.production.create({
                data: {
                    title: { nl: 'Initial' },
                    events: { create: { starts_at: new Date('2020-01-01') } }
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/productions',
                query: { page: '1', limit: '10' }
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(body.meta.page).toBe(1)
            expect(Array.isArray(body.data)).toBe(true)

            await app.prisma.event.deleteMany({ where: { production_id: production.id } })
            await app.prisma.production.delete({ where: { id: production.id } })
        })

        it('should search case-insensitively and support fuzzy matches in the title', async () => {
            const pastEvent = {
                create: {
                    starts_at: new Date('2020-01-01'),
                }
            }

            const titleMatch = await app.prisma.production.create({
                data: {
                    title: { nl: 'Pen' },
                    description_short: { nl: 'Korte intro' },
                    events: pastEvent,
                },
            })

            const noMatch = await app.prisma.production.create({
                data: {
                    title: { nl: 'Zonder connectie' },
                    description_short: { nl: 'Onverwante inhoud' },
                    events: pastEvent,
                },
            })

            try {
                const caseInsensitiveResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/productions',
                    query: {
                        page: '1',
                        limit: '20',
                        search: 'pEn',
                        lang: 'nl',
                    },
                })

                const caseInsensitiveBody = JSON.parse(caseInsensitiveResponse.payload)
                const caseInsensitiveIds = Array.isArray(caseInsensitiveBody.data)
                    ? caseInsensitiveBody.data.map((item: { id: string }) => item.id)
                    : []

                expect(caseInsensitiveResponse.statusCode).toBe(200)
                expect(caseInsensitiveIds).toContain(titleMatch.id)
                expect(caseInsensitiveIds).not.toContain(noMatch.id)

                const typoResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/productions',
                    query: {
                        page: '1',
                        limit: '20',
                        search: 'Penn',
                        lang: 'nl',
                    },
                })

                const typoBody = JSON.parse(typoResponse.payload)
                const typoIds = Array.isArray(typoBody.data)
                    ? typoBody.data.map((item: { id: string }) => item.id)
                    : []

                expect(typoResponse.statusCode).toBe(200)
                expect(typoIds).toContain(titleMatch.id)
            } finally {
                await app.prisma.event.deleteMany({
                    where: { production_id: { in: [titleMatch.id, noMatch.id] } }
                })
                await app.prisma.production.deleteMany({
                    where: { id: { in: [titleMatch.id, noMatch.id] } },
                })
            }
        })
    })

    describe('GET /api/v1/archive/productions/:id', () => {
        it('should return a production by ID', async () => {
            const production = await app.prisma.production.create({
                data: {
                    title: { nl: 'Detail Test' },
                    events: { create: { starts_at: new Date('2020-01-01') } }
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/archive/productions/${production.id}`
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body.data.id).toBe(production.id)
            expect(body.data.title.nl).toBe('Detail Test')

            await app.prisma.event.deleteMany({ where: { production_id: production.id } })
            await app.prisma.production.delete({ where: { id: production.id } })
        })

        it('should return 404 for non-existent production', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000'
            })

            expect(response.statusCode).toBe(404)
        })
    })
})
