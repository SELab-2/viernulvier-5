import type { FastifyPluginAsync } from 'fastify'
import { TaxonomiesRepository } from './taxonomies.repository.js'
import { TaxonomiesService } from './taxonomies.service.js'
import { TaxonomiesController } from './taxonomies.controller.js'
import { paginationQuerySchema, genreListSchema, tagListSchema } from './taxonomies.schema.js'

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
}

export default taxonomiesRoutes
