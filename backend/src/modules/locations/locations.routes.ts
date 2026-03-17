import type { FastifyPluginAsync } from 'fastify'
import { LocationsRepository } from './locations.repository.js'
import { LocationsService } from './locations.service.js'
import { LocationsController } from './locations.controller.js'
import { 
    paginationQuerySchema, 
    locationListSchema,
    locationSchema,
    idParamSchema,
    errorSchema,
    createLocationSchema,
    updateLocationSchema
} from './locations.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'
import { z } from 'zod'

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

    fastify.post('/', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['locations'],
            summary: 'Create a new location',
            body: createLocationSchema,
            response: {
                201: locationSchema,
            },
        },
        handler: (request, reply) => controller.createLocation(request as any, reply),
    })

    fastify.patch('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['locations'],
            summary: 'Update a location',
            params: idParamSchema,
            body: updateLocationSchema,
            response: {
                200: locationSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateLocation(request as any, reply),
    })

    fastify.delete('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['locations'],
            summary: 'Delete a location',
            params: idParamSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteLocation(request as any, reply),
    })

    // Halls (prefix will be /api/archive/halls when registered in app.ts)
}

export default locationsRoutes
