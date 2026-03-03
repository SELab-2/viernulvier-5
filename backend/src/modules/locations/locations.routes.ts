import type { FastifyPluginAsync } from 'fastify'
import { LocationsRepository } from './locations.repository.js'
import { LocationsService } from './locations.service.js'
import { LocationsController } from './locations.controller.js'
import { paginationQuerySchema, locationListSchema } from './locations.schema.js'

const locationsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new LocationsRepository(fastify.prisma)
    const service = new LocationsService(repository)
    const controller = new LocationsController(service)

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
}

export default locationsRoutes
