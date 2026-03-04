import type { FastifyPluginAsync } from 'fastify'
import { EventsRepository } from './events.repository.js'
import { EventsService } from './events.service.js'
import { EventsController } from './events.controller.js'
import { 
    paginationQuerySchema, 
    eventListSchema,
    eventPriceListSchema,
    eventStatusListSchema,
    eventExtraListSchema
} from './events.schema.js'

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

    fastify.get('/prices', {
        schema: {
            tags: ['events'],
            summary: 'Get a paginated list of event prices',
            querystring: paginationQuerySchema,
            response: {
                200: eventPriceListSchema,
            },
        },
        handler: (request, reply) => controller.getPrices(request as any, reply),
    })

    fastify.get('/statuses', {
        schema: {
            tags: ['events'],
            summary: 'Get a paginated list of event statuses',
            querystring: paginationQuerySchema,
            response: {
                200: eventStatusListSchema,
            },
        },
        handler: (request, reply) => controller.getStatuses(request as any, reply),
    })

    fastify.get('/extras', {
        schema: {
            tags: ['events'],
            summary: 'Get a paginated list of event extras',
            querystring: paginationQuerySchema,
            response: {
                200: eventExtraListSchema,
            },
        },
        handler: (request, reply) => controller.getExtras(request as any, reply),
    })
}

export default eventsRoutes
