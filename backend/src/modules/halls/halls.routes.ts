import type { FastifyPluginAsync } from 'fastify'
import { HallsRepository } from './halls.repository.js'
import { HallsService } from './halls.service.js'
import { HallsController } from './halls.controller.js'
import { 
    hallPaginationQuerySchema, 
    hallListSchema,
    singleHallSchema,
    idParamSchema,
    errorSchema,
    createHallSchema,
    updateHallSchema
} from './halls.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'
import { z } from 'zod'

const hallsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new HallsRepository(fastify.prisma)
    const service = new HallsService(repository)
    const controller = new HallsController(service)

    fastify.get('/', {
        schema: {
            tags: ['locations'], // Same tag as locations to group them in Swagger
            summary: 'Get a paginated list of halls',
            querystring: hallPaginationQuerySchema,
            response: {
                200: hallListSchema,
            },
        },
        handler: (request, reply) => controller.getHalls(request as any, reply),
    })

    fastify.get('/:id', {
        schema: {
            tags: ['locations'],
            summary: 'Get a hall by ID',
            params: idParamSchema,
            response: {
                200: singleHallSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getHall(request as any, reply),
    })

    fastify.post('/', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['locations'],
            summary: 'Create a new hall',
            body: createHallSchema,
            response: {
                201: singleHallSchema,
            },
        },
        handler: (request, reply) => controller.createHall(request as any, reply),
    })

    fastify.patch('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['locations'],
            summary: 'Update a hall',
            params: idParamSchema,
            body: updateHallSchema,
            response: {
                200: singleHallSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateHall(request as any, reply),
    })

    fastify.delete('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['locations'],
            summary: 'Delete a hall',
            params: idParamSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteHall(request as any, reply),
    })
}

export default hallsRoutes
