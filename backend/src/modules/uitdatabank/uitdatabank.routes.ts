import type { FastifyPluginAsync } from 'fastify'
import { UitdatabankRepository } from './uitdatabank.repository.js'
import { UitdatabankService } from './uitdatabank.service.js'
import { UitdatabankController } from './uitdatabank.controller.js'
import { 
    paginationQuerySchema, 
    keywordListSchema,
    themeListSchema,
    typeListSchema
} from './uitdatabank.schema.js'

const uitdatabankRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new UitdatabankRepository(fastify.prisma)
    const service = new UitdatabankService(repository)
    const controller = new UitdatabankController(service)

    fastify.get('/keywords', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a paginated list of UIT databank keywords',
            querystring: paginationQuerySchema,
            response: {
                200: keywordListSchema,
            },
        },
        handler: (request, reply) => controller.getKeywords(request as any, reply),
    })

    fastify.get('/themes', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a paginated list of UIT databank themes',
            querystring: paginationQuerySchema,
            response: {
                200: themeListSchema,
            },
        },
        handler: (request, reply) => controller.getThemes(request as any, reply),
    })

    fastify.get('/types', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a paginated list of UIT databank types',
            querystring: paginationQuerySchema,
            response: {
                200: typeListSchema,
            },
        },
        handler: (request, reply) => controller.getTypes(request as any, reply),
    })
}

export default uitdatabankRoutes
