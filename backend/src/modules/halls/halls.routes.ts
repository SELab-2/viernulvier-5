import type { FastifyPluginAsync } from 'fastify'
import { HallsRepository } from './halls.repository.js'
import { HallsService } from './halls.service.js'
import { HallsController } from './halls.controller.js'
import { paginationQuerySchema, hallListSchema } from './halls.schema.js'

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
}

export default hallsRoutes
