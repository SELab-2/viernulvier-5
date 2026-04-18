import type { FastifyPluginAsync } from 'fastify'
import { UitdatabankRepository } from './uitdatabank.repository.js'
import { UitdatabankService } from './uitdatabank.service.js'
import { UitdatabankController } from './uitdatabank.controller.js'
import { 
    uitdatabankPaginationQuerySchema, 
    keywordListSchema,
    singleKeywordSchema,
    themeListSchema,
    singleThemeSchema,
    typeListSchema,
    singleTypeSchema,
    idParamSchema,
    errorSchema
} from './uitdatabank.schema.js'

const uitdatabankRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new UitdatabankRepository(fastify.prisma)
    const service = new UitdatabankService(repository)
    const controller = new UitdatabankController(service)

    fastify.get('/keywords', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a paginated list of UIT databank keywords',
            querystring: uitdatabankPaginationQuerySchema,
            response: {
                200: keywordListSchema,
            },
        },
        handler: (request, reply) => controller.getKeywords(request as any, reply),
    })

    fastify.get('/keywords/:id', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a keyword by ID',
            params: idParamSchema,
            response: {
                200: singleKeywordSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getKeyword(request as any, reply),
    })

    fastify.get('/themes', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a paginated list of UIT databank themes',
            querystring: uitdatabankPaginationQuerySchema,
            response: {
                200: themeListSchema,
            },
        },
        handler: (request, reply) => controller.getThemes(request as any, reply),
    })

    fastify.get('/themes/:id', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a theme by ID',
            params: idParamSchema,
            response: {
                200: singleThemeSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getTheme(request as any, reply),
    })

    fastify.get('/types', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a paginated list of UIT databank types',
            querystring: uitdatabankPaginationQuerySchema,
            response: {
                200: typeListSchema,
            },
        },
        handler: (request, reply) => controller.getTypes(request as any, reply),
    })

    fastify.get('/types/:id', {
        schema: {
            tags: ['UIT databank'],
            summary: 'Get a type by ID',
            params: idParamSchema,
            response: {
                200: singleTypeSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getType(request as any, reply),
    })
}

export default uitdatabankRoutes
