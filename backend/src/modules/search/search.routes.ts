import type { FastifyPluginAsync } from 'fastify'
import { SearchRepository } from './search.repository.js'
import { SearchService } from './search.service.js'
import { SearchController } from './search.controller.js'
import { searchQuerySchema, searchListSchema } from './search.schema.js'

const searchRoutes: FastifyPluginAsync = async (fastify) => {
    const searchRepository = new SearchRepository(fastify.prisma)
    const service = new SearchService(searchRepository)
    const controller = new SearchController(service)

    // GET /api/v1/archive/search
    fastify.get('/', {
        schema: {
            hide: true,
            tags: ['search'],
            summary: 'Search across productions and posters',
            querystring: searchQuerySchema,
            response: {
                200: searchListSchema,
            },
        },
        handler: (request, reply) => controller.search(request as any, reply),
    })
}

export default searchRoutes
