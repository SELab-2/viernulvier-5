import type { FastifyPluginAsync } from 'fastify'
import { ArchiveRepository } from './archive.repository.js'
import { ArchiveService } from './archive.service.js'
import { ArchiveController } from './archive.controller.js'
import { 
    paginationQuerySchema, 
    productionListSchema, 
    eventListSchema,
    genreListSchema,
    locationListSchema 
} from './archive.schema.js'

/**
 * Archive routes
 *
 * This demonstrates the wiring pattern:
 *   repository → service → controller → routes
 *
 * Add real routes here once domain models are implemented.
 * Public routes (GET) need no auth.
 * Admin routes (POST/PUT/DELETE) use `preHandler: [requireAuth]`.
 */
const archiveRoutes: FastifyPluginAsync = async (fastify) => {
    // Wire up the dependency chain
    const repository = new ArchiveRepository(fastify.prisma)
    const service = new ArchiveService(repository)
    const controller = new ArchiveController(service)

    // GET /api/archive/productions
    fastify.get('/productions', {
        schema: {
            tags: ['archive'],
            summary: 'Get a paginated list of productions',
            querystring: paginationQuerySchema,
            response: {
                200: productionListSchema,
            },
        },
        handler: (request, reply) => controller.getProductions(request as any, reply),
    })

    // GET /api/archive/events
    fastify.get('/events', {
        schema: {
            tags: ['archive'],
            summary: 'Get a paginated list of events',
            querystring: paginationQuerySchema,
            response: {
                200: eventListSchema,
            },
        },
        handler: (request, reply) => controller.getEvents(request as any, reply),
    })

    // GET /api/archive/locations
    fastify.get('/locations', {
        schema: {
            tags: ['archive'],
            summary: 'Get a paginated list of locations',
            querystring: paginationQuerySchema,
            response: {
                200: locationListSchema,
            },
        },
        handler: (request, reply) => controller.getLocations(request as any, reply),
    })
}

export default archiveRoutes
