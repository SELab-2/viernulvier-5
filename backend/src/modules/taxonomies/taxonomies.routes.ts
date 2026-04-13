import type { FastifyPluginAsync } from 'fastify'
import { TaxonomiesRepository } from './taxonomies.repository.js'
import { TaxonomiesService } from './taxonomies.service.js'
import { TaxonomiesController } from './taxonomies.controller.js'
import { 
    genrePaginationQuerySchema,
    tagPaginationQuerySchema,
    genreListSchema, 
    singleGenreSchema,
    tagListSchema,
    singleTagSchema,
    idParamSchema,
    errorSchema,
    createGenreSchema,
    updateGenreSchema,
    createTagSchema,
    updateTagSchema
} from './taxonomies.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'
import { z } from 'zod'

const taxonomiesRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new TaxonomiesRepository(fastify.prisma)
    const service = new TaxonomiesService(repository)
    const controller = new TaxonomiesController(service)

    // --- Genres ---
    fastify.get('/genres', {
        schema: {
            tags: ['taxonomies'],
            summary: 'Get a paginated list of genres',
            querystring: genrePaginationQuerySchema,
            response: {
                200: genreListSchema,
            },
        },
        handler: (request, reply) => controller.getGenres(request as any, reply),
    })

    fastify.get('/genres/:id', {
        schema: {
            tags: ['taxonomies'],
            summary: 'Get a genre by ID',
            params: idParamSchema,
            response: {
                200: singleGenreSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getGenre(request as any, reply),
    })

    fastify.post('/genres', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['taxonomies'],
            summary: 'Create a new genre',
            body: createGenreSchema,
            response: {
                201: singleGenreSchema,
            },
        },
        handler: (request, reply) => controller.createGenre(request as any, reply),
    })

    fastify.patch('/genres/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['taxonomies'],
            summary: 'Update a genre',
            params: idParamSchema,
            body: updateGenreSchema,
            response: {
                200: singleGenreSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateGenre(request as any, reply),
    })

    fastify.delete('/genres/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['taxonomies'],
            summary: 'Delete a genre',
            params: idParamSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteGenre(request as any, reply),
    })

    // --- Tags ---
    fastify.get('/tags', {
        schema: {
            tags: ['taxonomies'],
            summary: 'Get a paginated list of tags',
            querystring: tagPaginationQuerySchema,
            response: {
                200: tagListSchema,
            },
        },
        handler: (request, reply) => controller.getTags(request as any, reply),
    })

    fastify.get('/tags/:id', {
        schema: {
            tags: ['taxonomies'],
            summary: 'Get a tag by ID',
            params: idParamSchema,
            response: {
                200: singleTagSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getTag(request as any, reply),
    })

    fastify.post('/tags', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['taxonomies'],
            summary: 'Create a new tag',
            body: createTagSchema,
            response: {
                201: singleTagSchema,
            },
        },
        handler: (request, reply) => controller.createTag(request as any, reply),
    })

    fastify.patch('/tags/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['taxonomies'],
            summary: 'Update a tag',
            params: idParamSchema,
            body: updateTagSchema,
            response: {
                200: singleTagSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateTag(request as any, reply),
    })

    fastify.delete('/tags/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['taxonomies'],
            summary: 'Delete a tag',
            params: idParamSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteTag(request as any, reply),
    })
}

export default taxonomiesRoutes
