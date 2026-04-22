import type { FastifyPluginAsync } from 'fastify'
import { ProductionsRepository } from '../productions/productions.repository.js'
import { BlogsRepository } from '../blogs/blogs.repository.js'
import { SearchService } from './search.service.js'
import { searchQuerySchema, searchListSchema } from './search.schema.js'

const searchRoutes: FastifyPluginAsync = async (fastify) => {
    const productionsRepo = new ProductionsRepository(fastify.prisma)
    const blogsRepo = new BlogsRepository(fastify.prisma)
    const service = new SearchService(productionsRepo, blogsRepo)

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
        handler: async (request, reply) => {
            const query = request.query as any
            const result = await service.search(query)
            return reply.send({
                data: result.items,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
                links: {
                    self: request.url,
                    next: result.page < result.totalPages ? `${request.routeOptions.url}?page=${result.page + 1}&limit=${result.limit}` : null,
                    prev: result.page > 1 ? `${request.routeOptions.url}?page=${result.page - 1}&limit=${result.limit}` : null,
                    first: `${request.routeOptions.url}?page=1&limit=${result.limit}`,
                    last: `${request.routeOptions.url}?page=${result.totalPages}&limit=${result.limit}`,
                },
            })
        },
    })
}

export default searchRoutes
