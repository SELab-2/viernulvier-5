import type { FastifyPluginAsync } from 'fastify'
import { SpacesRepository } from './spaces.repository.js'
import { SpacesService } from './spaces.service.js'
import { SpacesController } from './spaces.controller.js'
import { 
    paginationQuerySchema, 
    spaceListSchema,
    spaceSchema,
    idParamSchema,
    errorSchema,
    createSpaceSchema,
    updateSpaceSchema
} from './spaces.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'
import { z } from 'zod'

const spacesRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new SpacesRepository(fastify.prisma)
    const service = new SpacesService(repository)
    const controller = new SpacesController(service)

    fastify.get('/', {
        schema: {
            tags: ['locations'], // Same tag as locations to group them in Swagger
            summary: 'Get a paginated list of spaces',
            querystring: paginationQuerySchema,
            response: {
                200: spaceListSchema,
            },
        },
        handler: (request, reply) => controller.getSpaces(request as any, reply),
    })

    fastify.get('/:id', {
        schema: {
            tags: ['locations'],
            summary: 'Get a space by ID',
            params: idParamSchema,
            response: {
                200: spaceSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getSpace(request as any, reply),
    })

    fastify.post('/', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['locations'],
            summary: 'Create a new space',
            body: createSpaceSchema,
            response: {
                201: spaceSchema,
            },
        },
        handler: (request, reply) => controller.createSpace(request as any, reply),
    })

    fastify.patch('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['locations'],
            summary: 'Update a space',
            params: idParamSchema,
            body: updateSpaceSchema,
            response: {
                200: spaceSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateSpace(request as any, reply),
    })

    fastify.delete('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['locations'],
            summary: 'Delete a space',
            params: idParamSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteSpace(request as any, reply),
    })
}

export default spacesRoutes
