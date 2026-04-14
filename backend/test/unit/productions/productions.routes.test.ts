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
        })

        it('should search case-insensitively, support fuzzy matches, and include description fields', async () => {
            const titleMatch = await app.prisma.production.create({
                data: {
                    title: { nl: 'Pen' },
                    description_short: { nl: 'Korte intro' },
                },
            })

            const descriptionMatch = await app.prisma.production.create({
                data: {
                    title: { nl: 'Volledig andere titel' },
                    description: { nl: 'Dit verhaal gaat over een antieke vulpen uit Gent.' },
                },
            })

            const noMatch = await app.prisma.production.create({
                data: {
                    title: { nl: 'Zonder connectie' },
                    description_short: { nl: 'Onverwante inhoud' },
                },
            })

            let rankingTitleFirstId: string | undefined
            let rankingDescriptionOnlyId: string | undefined

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

                const descriptionResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/productions',
                    query: {
                        page: '1',
                        limit: '20',
                        search: 'vulpen',
                        lang: 'nl',
                    },
                })

                const descriptionBody = JSON.parse(descriptionResponse.payload)
                const descriptionIds = Array.isArray(descriptionBody.data)
                    ? descriptionBody.data.map((item: { id: string }) => item.id)
                    : []

                expect(descriptionResponse.statusCode).toBe(200)
                expect(descriptionIds).toContain(descriptionMatch.id)
                expect(descriptionIds).not.toContain(noMatch.id)

                const rankingTitleFirst = await app.prisma.production.create({
                    data: {
                        title: { nl: 'Aardappel' },
                        description: { nl: 'Titel exact match' },
                    },
                })
                rankingTitleFirstId = rankingTitleFirst.id

                const rankingDescriptionOnly = await app.prisma.production.create({
                    data: {
                        title: { nl: 'Geen aardappel titel' },
                        description: { nl: 'Hier staat aardappel enkel in de beschrijving.' },
                    },
                })
                rankingDescriptionOnlyId = rankingDescriptionOnly.id

                const rankingResponse = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/productions',
                    query: {
                        page: '1',
                        limit: '20',
                        search: 'aardappel',
                        lang: 'nl',
                    },
                })

                const rankingBody = JSON.parse(rankingResponse.payload)
                const rankingIds = Array.isArray(rankingBody.data)
                    ? rankingBody.data.map((item: { id: string }) => item.id)
                    : []

                const titleIndex = rankingIds.indexOf(rankingTitleFirst.id)
                const descriptionIndex = rankingIds.indexOf(rankingDescriptionOnly.id)

                expect(rankingResponse.statusCode).toBe(200)
                expect(titleIndex).toBeGreaterThanOrEqual(0)
                expect(descriptionIndex).toBeGreaterThanOrEqual(0)
                expect(titleIndex).toBeLessThan(descriptionIndex)

            } finally {
                await app.prisma.production.deleteMany({
                    where: {
                        id: {
                            in: [
                                titleMatch.id,
                                descriptionMatch.id,
                                noMatch.id,
                                ...(rankingTitleFirstId ? [rankingTitleFirstId] : []),
                                ...(rankingDescriptionOnlyId ? [rankingDescriptionOnlyId] : []),
                            ],
                        },
                    },
                })
            }
        })

        it('should filter productions by month/day across years when onThisDay is enabled', async () => {
            const matchingProduction = await app.prisma.production.create({
                data: {
                    title: { nl: 'Matching Day Production' },
                },
            })

            const nonMatchingProduction = await app.prisma.production.create({
                data: {
                    title: { nl: 'Other Day Production' },
                },
            })

            const matchingEvent = await app.prisma.event.create({
                data: {
                    production_id: matchingProduction.id,
                    starts_at: new Date('1980-04-13T20:00:00.000Z'),
                },
            })

            const nonMatchingEvent = await app.prisma.event.create({
                data: {
                    production_id: nonMatchingProduction.id,
                    starts_at: new Date('2003-05-14T20:00:00.000Z'),
                },
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: '/api/v1/archive/productions',
                    query: {
                        page: '1',
                        limit: '20',
                        onThisDay: 'true',
                        referenceDate: '2026-04-13',
                    },
                })

                const body = JSON.parse(response.payload)
                const ids = Array.isArray(body.data) ? body.data.map((item: { id: string }) => item.id) : []

                expect(response.statusCode).toBe(200)
                expect(ids).toContain(matchingProduction.id)
                expect(ids).not.toContain(nonMatchingProduction.id)
            } finally {
                await app.prisma.event.deleteMany({
                    where: {
                        id: {
                            in: [matchingEvent.id, nonMatchingEvent.id],
                        },
                    },
                })

                await app.prisma.production.deleteMany({
                    where: {
                        id: {
                            in: [matchingProduction.id, nonMatchingProduction.id],
                        },
                    },
                })
            }
        })
    })

    describe('GET /api/v1/archive/productions/:id', () => {
        it('should return a production by ID with 200 OK', async () => {
            const production = await app.prisma.production.create({
                data: {
                    title: { nl: 'Test Production by ID' },
                    artist: { nl: 'Test Artist' }
                }
            })

            try {
                const response = await app.inject({
                    method: 'GET',
                    url: `/api/v1/archive/productions/${production.id}`,
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                expect(body.data.id).toBe(production.id)
                expect(body.data.title.nl).toBe('Test Production by ID')
                expect(body.data).toHaveProperty('links')
                expect(body.data.links).toHaveProperty('self')
            } finally {
                await app.prisma.production.delete({
                    where: { id: production.id }
                })
            }
        })

        it('should return 404 Not Found for non-existent ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'GET',
                url: `/api/v1/archive/productions/${nonExistentId}`,
            })

            expect(response.statusCode).toBe(404)
            const body = JSON.parse(response.payload)
            expect(body.message).toBe('Production not found')
        })
    })

    describe('POST /api/v1/archive/productions', () => {
        it('should create a production in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const payload = { 
                title: { nl: 'Test New Production' },
                artist: { nl: 'Test New Artist' }
            }

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/productions',
                headers: { authorization: `Bearer ${token}` },
                payload
            })

            expect(response.statusCode).toBe(201)
            const body = JSON.parse(response.payload)
            const created = body.data

            const dbRecord = await app.prisma.production.findUnique({
                where: { id: created.id }
            })
            expect(dbRecord).not.toBeNull()
            expect((dbRecord?.title as any).nl).toBe(payload.title.nl)
            expect(body.links).toHaveProperty('self')

            await app.prisma.production.delete({
                where: { id: created.id }
            })
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/productions',
                payload: { title: { nl: 'Unauthorized' } }
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('PATCH /api/v1/archive/productions/:id', () => {
        it('should update a production in the DB and then clean up', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            
            const initialProd = await app.prisma.production.create({
                data: {
                    title: { nl: 'Initial Title' },
                    artist: { nl: 'Initial Artist' }
                }
            })

            const updatePayload = { title: { nl: 'Updated Title' } }

            try {
                const response = await app.inject({
                    method: 'PATCH',
                    url: `/api/v1/archive/productions/${initialProd.id}`,
                    headers: { authorization: `Bearer ${token}` },
                    payload: updatePayload
                })

                expect(response.statusCode).toBe(200)
                const body = JSON.parse(response.payload)
                const updated = body.data
                expect(updated.title.nl).toBe(updatePayload.title.nl)
                expect(updated.links).toHaveProperty('self')
            } finally {
                await app.prisma.production.delete({
                    where: { id: initialProd.id }
                })
            }
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const id = '00000000-0000-0000-0000-000000000000'
            const response = await app.inject({
                method: 'PATCH',
                url: `/api/v1/archive/productions/${id}`,
                payload: { title: { nl: 'Unauthorized' } }
            })

            expect(response.statusCode).toBe(401)
        })

        it('should return 404 for non-existent production', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` },
                payload: { title: { nl: 'Non-existent' } }
            })
            expect(response.statusCode).toBe(404)
        })
    })

    describe('DELETE /api/v1/archive/productions/:id', () => {
        it('should return 401 when no token provided', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000'
            })
            expect(response.statusCode).toBe(401)
        })

        it('should delete a production', async () => {
            const production = await app.prisma.production.create({
                data: { title: { nl: 'To Be Deleted' } }
            })

            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const response = await app.inject({
                method: 'DELETE',
                url: `/api/v1/archive/productions/${production.id}`,
                headers: { authorization: `Bearer ${token}` }
            })

            expect(response.statusCode).toBe(204)

            const dbRecord = await app.prisma.production.findUnique({
                where: { id: production.id }
            })
            expect(dbRecord).toBeNull()
        })

        it('should return 404 for non-existent production', async () => {
            const token = app.jwt.sign({ sub: 'admin', username: 'admin', role: Role.ADMIN })
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000',
                headers: { authorization: `Bearer ${token}` }
            })
            expect(response.statusCode).toBe(404)
        })
    })
})
