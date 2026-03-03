import type { FastifyPluginAsync } from 'fastify'
import { TaxonomiesRepository } from './taxonomies.repository.js'
import { TaxonomiesService } from './taxonomies.service.js'
import { TaxonomiesController } from './taxonomies.controller.js'
import { paginationQuerySchema, genreListSchema } from './taxonomies.schema.js'

const taxonomiesRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new TaxonomiesRepository(fastify.prisma)
    const service = new TaxonomiesService(repository)
    const controller = new TaxonomiesController(service)

    fastify.get('/', {
        schema: {
            tags: ['genres'],
            summary: 'Get a paginated list of genres',
            querystring: paginationQuerySchema,
            response: {
                200: genreListSchema,
            },
        },
        handler: (request, reply) => controller.getGenres(request as any, reply),
    })
}

export default taxonomiesRoutes
