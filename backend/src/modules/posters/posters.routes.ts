import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { Permission } from '../../domain/permissions.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { PostersController } from './posters.controller.js'
import { PostersRepository } from './posters.repository.js'
import {
    createPosterSchema,
    errorSchema,
    posterIdParamSchema,
    posterListSchema,
    posterPaginationQuerySchema,
    singlePosterSchema,
    updatePosterSchema,
} from './posters.schema.js'
import { PostersService } from './posters.service.js'

const postersRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new PostersRepository(fastify.prisma)
    const service = new PostersService(repository)
    const controller = new PostersController(service)

    fastify.get('/', {
        schema: {
            tags: ['posters'],
            summary: 'Get a paginated list of posters',
            querystring: posterPaginationQuerySchema,
            response: {
                200: posterListSchema,
            },
        },
        handler: (request, reply) => controller.getPosters(request as any, reply),
    })

    fastify.get('/:id', {
        schema: {
            tags: ['posters'],
            summary: 'Get a poster by ID',
            params: posterIdParamSchema,
            response: {
                200: singlePosterSchema,
                404: errorSchema,
            },
        },
        handler: (request, reply) => controller.getPoster(request as any, reply),
    })

    fastify.get('/:id/file', {
        schema: {
            tags: ['posters'],
            summary: 'Get poster file',
            params: posterIdParamSchema,
            response: {
                404: errorSchema,
            },
        },
        handler: (request, reply) => controller.getPosterFile(request as any, reply),
    })

    fastify.post('/', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['posters'],
            summary: 'Create a poster with title, production and image file',
            body: createPosterSchema,
            response: {
                201: singlePosterSchema,
                400: errorSchema,
            },
        },
        handler: (request, reply) => controller.createPoster(request as any, reply),
    })

    fastify.patch('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['posters'],
            summary: 'Update poster metadata',
            params: posterIdParamSchema,
            body: updatePosterSchema,
            response: {
                200: singlePosterSchema,
                404: errorSchema,
            },
        },
        handler: (request, reply) => controller.updatePoster(request as any, reply),
    })

    fastify.delete('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['posters'],
            summary: 'Delete a poster',
            params: posterIdParamSchema,
            response: {
                204: z.null(),
                404: errorSchema,
            },
        },
        handler: (request, reply) => controller.deletePoster(request as any, reply),
    })
}

export default postersRoutes
