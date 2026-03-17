import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

describe('swagger plugin', () => {
    let app: Awaited<ReturnType<typeof Fastify>>

    beforeEach(async () => {
        vi.resetModules()
        process.env.JWT_SECRET = 'test-jwt-secret'
        process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/viernulvier'
        process.env.NODE_ENV = 'test'

        const swaggerPlugin = (await import('../../../src/plugins/swagger.js')).default

        app = Fastify({ logger: false })
        app.setValidatorCompiler(validatorCompiler)
        app.setSerializerCompiler(serializerCompiler)

        await app.register(swaggerPlugin)
        app.get('/example', {
            schema: {
                querystring: z.object({
                    search: z.string().optional(),
                }),
                response: {
                    200: z.object({
                        ok: z.boolean(),
                    }),
                },
            },
            handler: async () => ({ ok: true }),
        })
    })

    afterEach(async () => {
        await app.close()
    })

    it('serves openapi json for zod-backed routes', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/docs/json',
        })

        expect(response.statusCode).toBe(200)

        const body = response.json()
        expect(body.openapi).toBe('3.0.3')
        expect(body.paths['/example']).toBeTruthy()
        expect(body.paths['/example'].get.parameters).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    in: 'query',
                    name: 'search',
                }),
            ])
        )
    })
})
