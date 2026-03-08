import type { FastifyPluginAsync } from 'fastify'
import { SpacesRepository } from './spaces.repository.js'
import { SpacesService } from './spaces.service.js'
import { SpacesController } from './spaces.controller.js'
import { 
    paginationQuerySchema, 
    spaceListSchema,
    spaceSchema,
    idParamSchema,
    errorSchema
} from './spaces.schema.js'

const spacesRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new SpacesRepository(fastify.prisma)
    const service = new SpacesService(repository)
    const controller = new SpacesController(service)

    fastify.get('/', {
        schema: {
            tags: ['locations'], // Same tag as locations to group them in Swagger
            summary: 'Get a paginated list of spaces',
            querystring: paginationQuerySchema,
            response: {
                200: spaceListSchema,
            },
        },
        handler: (request, reply) => controller.getSpaces(request as any, reply),
    })

    fastify.get('/:id', {
        schema: {
            tags: ['locations'],
            summary: 'Get a space by ID',
            params: idParamSchema,
            response: {
                200: spaceSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getSpace(request as any, reply),
    })
}

export default spacesRoutes
