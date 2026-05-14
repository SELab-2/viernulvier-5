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
                    title: {nl: 'Initial'},
                    events: {create: {starts_at: new Date('2020-01-01')}}
                }
            })

            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/productions',
                query: {page: '1', limit: '10'}
            })

            const body = JSON.parse(response.payload)

            expect(response.statusCode).toBe(200)
            expect(body).toHaveProperty('data')
            expect(body).toHaveProperty('meta')
            expect(body).toHaveProperty('links')
            expect(body.meta.page).toBe(1)
            expect(Array.isArray(body.data)).toBe(true)

            await app.prisma.event.deleteMany({where: {production_id: production.id}})
            await app.prisma.production.delete({where: {id: production.id}})
        })

        it('should search case-insensitively and support fuzzy matches in the title', async () => {
            const pastEvent = {
                create: {
                    starts_at: new Date('2020-01-01'),
                }
            }

            const titleMatch = await app.prisma.production.create({
                data: {
                    title: {nl: 'Pen'},
                    description_short: {nl: 'Korte intro'},
                    events: pastEvent,
                },
            })

            const noMatch = await app.prisma.production.create({
                data: {
                    title: {nl: 'Zonder connectie'},
                    description_short: {nl: 'Onverwante inhoud'},
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
                    where: {production_id: {in: [titleMatch.id, noMatch.id]}}
                })
                await app.prisma.production.deleteMany({
                    where: {id: {in: [titleMatch.id, noMatch.id]}},
                })
            }
        })
    })

    describe('GET /api/v1/archive/productions/:id', () => {
        it('should return a production by ID', async () => {
            const production = await app.prisma.production.create({
                data: {
                    title: {nl: 'Detail Test'},
                    events: {create: {starts_at: new Date('2020-01-01')}}
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

            await app.prisma.event.deleteMany({where: {production_id: production.id}})
            await app.prisma.production.delete({where: {id: production.id}})
        })

        it('should return 404 for non-existent production', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000'
            })

            expect(response.statusCode).toBe(404)
        })
    })

    describe('POST /api/v1/archive/productions/:id/editors', () => {
        it('should assign an editor to a production and return 204', async () => {
            const token = app.jwt.sign({sub: 'admin', username: 'admin', role: Role.ADMIN})

            const production = await app.prisma.production.create({
                data: {
                    title: {nl: 'Editor Test'},
                    events: {create: {starts_at: new Date('2020-01-01')}}
                }
            })

            const editor = await app.prisma.adminUser.create({
                data: {
                    username: 'testeditor',
                    passwordHash: 'hash',
                    role: Role.EDITOR,
                }
            })

            try {
                const response = await app.inject({
                    method: 'POST',
                    url: `/api/v1/archive/productions/${production.id}/editors`,
                    headers: {authorization: `Bearer ${token}`},
                    payload: {editorId: editor.id}
                })

                expect(response.statusCode).toBe(204)

                const link = await app.prisma.editor_production.findUnique({
                    where: {
                        editor_id_production_id: {
                            editor_id: editor.id,
                            production_id: production.id,
                        }
                    }
                })
                expect(link).not.toBeNull()
            } finally {
                await app.prisma.editor_production.deleteMany({where: {production_id: production.id}})
                await app.prisma.event.deleteMany({where: {production_id: production.id}})
                await app.prisma.production.delete({where: {id: production.id}})
                await app.prisma.adminUser.delete({where: {id: editor.id}})
            }
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000/editors',
                payload: {editorId: '00000000-0000-0000-0000-000000000001'}
            })

            expect(response.statusCode).toBe(401)
        })
    })

    describe('DELETE /api/v1/archive/productions/:id/editors/:editorId', () => {
        it('should remove an editor from a production and return 204', async () => {
            const token = app.jwt.sign({sub: 'admin', username: 'admin', role: Role.ADMIN})

            const production = await app.prisma.production.create({
                data: {
                    title: {nl: 'Editor Remove Test'},
                    events: {create: {starts_at: new Date('2020-01-01')}}
                }
            })

            const editor = await app.prisma.adminUser.create({
                data: {
                    username: 'testeditor2',
                    passwordHash: 'hash',
                    role: Role.EDITOR,
                }
            })

            await app.prisma.editor_production.create({
                data: {
                    editor_id: editor.id,
                    production_id: production.id,
                }
            })

            try {
                const response = await app.inject({
                    method: 'DELETE',
                    url: `/api/v1/archive/productions/${production.id}/editors/${editor.id}`,
                    headers: {authorization: `Bearer ${token}`},
                })

                expect(response.statusCode).toBe(204)

                const link = await app.prisma.editor_production.findUnique({
                    where: {
                        editor_id_production_id: {
                            editor_id: editor.id,
                            production_id: production.id,
                        }
                    }
                })
                expect(link).toBeNull()
            } finally {
                await app.prisma.editor_production.deleteMany({where: {production_id: production.id}})
                await app.prisma.event.deleteMany({where: {production_id: production.id}})
                await app.prisma.production.delete({where: {id: production.id}})
                await app.prisma.adminUser.delete({where: {id: editor.id}})
            }
        })

        it('should return 401 Unauthorized when no token is provided', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/archive/productions/00000000-0000-0000-0000-000000000000/editors/00000000-0000-0000-0000-000000000001',
            })

            expect(response.statusCode).toBe(401)
        })
    })
})