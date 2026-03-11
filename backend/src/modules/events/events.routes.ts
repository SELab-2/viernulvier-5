import type { FastifyPluginAsync } from 'fastify'
import { EventsRepository } from './events.repository.js'
import { EventsService } from './events.service.js'
import { EventsController } from './events.controller.js'
import { z } from 'zod'
import { 
    paginationQuerySchema, 
    eventListSchema,
    eventPriceListSchema,
    eventPriceSchema,
    eventSchema,
    updateEventSchema,
    updateEventParamsSchema,
    createEventSchema,
    errorSchema
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

    fastify.get('/:id', {
        schema: {
            tags: ['events'],
            summary: 'Get an event by ID',
            params: updateEventParamsSchema,
            response: {
                200: eventSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getEvent(request as any, reply),
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

    fastify.get('/prices/:id', {
        schema: {
            tags: ['events'],
            summary: 'Get an event price by ID',
            params: updateEventParamsSchema,
            response: {
                200: eventPriceSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getEventPrice(request as any, reply),
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
    fastify.patch('/:id', {
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

    fastify.delete('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['events'],
            summary: 'Delete an event',
            params: updateEventParamsSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteEvent(request as any, reply),
    })
}

export default eventsRoutes
