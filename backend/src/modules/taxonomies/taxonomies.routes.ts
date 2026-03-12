import type { FastifyPluginAsync } from 'fastify'
import { TaxonomiesRepository } from './taxonomies.repository.js'
import { TaxonomiesService } from './taxonomies.service.js'
import { TaxonomiesController } from './taxonomies.controller.js'
import { 
    paginationQuerySchema, 
    genreListSchema, 
    genreSchema,
    tagListSchema,
    tagSchema,
    idParamSchema,
    errorSchema,
    createGenreSchema,
    updateGenreSchema,
    createTagSchema,
    updateTagSchema
} from './taxonomies.schema.js'
import { requireAuth } from '../../hooks/require-auth.js'
import { z } from 'zod'

const taxonomiesRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new TaxonomiesRepository(fastify.prisma)
    const service = new TaxonomiesService(repository)
    const controller = new TaxonomiesController(service)

    // GET /api/archive/genres
    fastify.get('/genres', {
        schema: {
            tags: ['taxonomies'],
            summary: 'Get a paginated list of genres',
            querystring: paginationQuerySchema,
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
                200: genreSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getGenre(request as any, reply),
    })

    fastify.post('/genres', {
        preHandler: [requireAuth],
        schema: {
            tags: ['taxonomies'],
            summary: 'Create a new genre',
            body: createGenreSchema,
            response: {
                201: genreSchema,
            },
        },
        handler: (request, reply) => controller.createGenre(request as any, reply),
    })

    fastify.patch('/genres/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['taxonomies'],
            summary: 'Update a genre',
            params: idParamSchema,
            body: updateGenreSchema,
            response: {
                200: genreSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateGenre(request as any, reply),
    })

    fastify.delete('/genres/:id', {
        preHandler: [requireAuth],
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

    // GET /api/archive/tags
    fastify.get('/tags', {
        schema: {
            tags: ['taxonomies'],
            summary: 'Get a paginated list of tags',
            querystring: paginationQuerySchema,
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
                200: tagSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getTag(request as any, reply),
    })

    fastify.post('/tags', {
        preHandler: [requireAuth],
        schema: {
            tags: ['taxonomies'],
            summary: 'Create a new tag',
            body: createTagSchema,
            response: {
                201: tagSchema,
            },
        },
        handler: (request, reply) => controller.createTag(request as any, reply),
    })

    fastify.patch('/tags/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['taxonomies'],
            summary: 'Update a tag',
            params: idParamSchema,
            body: updateTagSchema,
            response: {
                200: tagSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateTag(request as any, reply),
    })

    fastify.delete('/tags/:id', {
        preHandler: [requireAuth],
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
