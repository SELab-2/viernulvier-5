import type { FastifyPluginAsync } from 'fastify'
import { EventsRepository } from './events.repository.js'
import { EventsService } from './events.service.js'
import { EventsController } from './events.controller.js'
import { paginationQuerySchema, eventListSchema } from './events.schema.js'

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new EventsRepository(fastify.prisma)
    const service = new EventsService(repository)
    const controller = new EventsController(service)

    fastify.get('/', {
        schema: {
            tags: ['events'],
            summary: 'Get a paginated list of events',
            querystring: paginationQuerySchema,
            response: {
                200: eventListSchema,
            },
        },
        handler: (request, reply) => controller.getEvents(request as any, reply),
    })
}

export default eventsRoutes
