import fp from 'fastify-plugin'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

/**
 * Swagger/OpenAPI plugin — auto-generates API docs from route schemas.
 * Accessible at /docs in development.
 */
export default fp(async (fastify) => {
    await fastify.register(swagger, {
        openapi: {
            info: {
                title: 'VIERNULVIER Archief API',
                description: 'REST API voor het VIERNULVIER archiefwebsite',
                version: '0.1.0',
            },
            servers: [
                { url: 'http://localhost:3001', description: 'Local development' },
            ],
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: 'apiKey',
                        in: 'cookie',
                        name: 'token',
                    },
                },
            },
        },
        transform: jsonSchemaTransform,
    })

    await fastify.register(swaggerUi, {
        routePrefix: '/docs',
    })
})
