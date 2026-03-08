import type { FastifyPluginAsync } from 'fastify'
import { EventsRepository } from './events.repository.js'
import { EventsService } from './events.service.js'
import { EventsController } from './events.controller.js'
import { 
    paginationQuerySchema, 
    eventListSchema,
    eventPriceListSchema,
    eventSchema,
    updateEventSchema,
    updateEventParamsSchema,
    createEventSchema
} from './events.schema.js'
import { requireAuth } from '../../hooks/require-auth.js'

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

    // POST /api/archive/events
    fastify.post('/', {
        preHandler: [requireAuth],
        schema: {
            tags: ['events'],
            summary: 'Create a new event',
            body: createEventSchema,
            response: {
                201: eventSchema,
            },
        },
        handler: (request, reply) => controller.createEvent(request as any, reply),
    })

    // PUT /api/archive/events/:id
    fastify.put('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['events'],
            summary: 'Update an event',
            params: updateEventParamsSchema,
            body: updateEventSchema,
            response: {
                200: eventSchema,
            },
        },
        handler: (request, reply) => controller.updateEvent(request as any, reply),
    })
}

export default eventsRoutes
