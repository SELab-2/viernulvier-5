import type { FastifyPluginAsync } from 'fastify'
import { HallsRepository } from './halls.repository.js'
import { HallsService } from './halls.service.js'
import { HallsController } from './halls.controller.js'
import { 
    paginationQuerySchema, 
    hallListSchema,
    hallSchema,
    idParamSchema,
    errorSchema
} from './halls.schema.js'

const hallsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new HallsRepository(fastify.prisma)
    const service = new HallsService(repository)
    const controller = new HallsController(service)

    fastify.get('/', {
        schema: {
            tags: ['locations'], // Same tag as locations to group them in Swagger
            summary: 'Get a paginated list of halls',
            querystring: paginationQuerySchema,
            response: {
                200: hallListSchema,
            },
        },
        handler: (request, reply) => controller.getHalls(request as any, reply),
    })

    fastify.get('/:id', {
        schema: {
            tags: ['locations'],
            summary: 'Get a hall by ID',
            params: idParamSchema,
            response: {
                200: hallSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getHall(request as any, reply),
    })
}

export default hallsRoutes
