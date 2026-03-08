import type { FastifyPluginAsync } from 'fastify'
import { LocationsRepository } from './locations.repository.js'
import { LocationsService } from './locations.service.js'
import { LocationsController } from './locations.controller.js'
import { 
    paginationQuerySchema, 
    locationListSchema,
    locationSchema,
    hallListSchema,
    hallSchema,
    spaceListSchema,
    spaceSchema,
    idParamSchema,
    errorSchema
} from './locations.schema.js'

const locationsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new LocationsRepository(fastify.prisma)
    const service = new LocationsService(repository)
    const controller = new LocationsController(service)

    // Locations
    fastify.get('/', {
        schema: {
            tags: ['locations'],
            summary: 'Get a paginated list of locations',
            querystring: paginationQuerySchema,
            response: {
                200: locationListSchema,
            },
        },
        handler: (request, reply) => controller.getLocations(request as any, reply),
    })

    fastify.get('/:id', {
        schema: {
            tags: ['locations'],
            summary: 'Get a location by ID',
            params: idParamSchema,
            response: {
                200: locationSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getLocation(request as any, reply),
    })

    // Halls (prefix will be /api/archive/halls when registered in app.ts)
    // Wait, let's check app.ts registration
}

export default locationsRoutes
