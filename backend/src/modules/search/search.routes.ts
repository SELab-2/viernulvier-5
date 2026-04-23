import type { FastifyPluginAsync } from 'fastify'
import { SearchRepository } from './search.repository.js'
import { SearchService } from './search.service.js'
import { SearchController } from './search.controller.js'
import { searchQuerySchema, searchListSchema } from './search.schema.js'
import { ProductionsRepository } from '../productions/productions.repository.js'
import { ProductionsService } from '../productions/productions.service.js'

const searchRoutes: FastifyPluginAsync = async (fastify) => {
    const searchRepository = new SearchRepository(fastify.prisma)
    const productionsRepository = new ProductionsRepository(fastify.prisma)
    const productionsService = new ProductionsService(productionsRepository)
    const service = new SearchService(searchRepository, productionsService)
    const controller = new SearchController(service)

    // GET /api/v1/archive/search
    fastify.get('/', {
        schema: {
            tags: ['search'],
            summary: 'Search across productions and blogs',
            querystring: searchQuerySchema,
            response: {
                200: searchListSchema,
            },
        },
        handler: (request, reply) => controller.search(request as any, reply),
    })
}

export default searchRoutes
