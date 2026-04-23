import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SearchService } from './search.service.js'
import type { SearchQuery } from './search.schema.js'

export class SearchController {
    constructor(private readonly service: SearchService) {}

    async search(request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) {
        const result = await this.service.search(request.query)
        const baseUrl = request.routeOptions.url ?? '/api/v1/archive/search'

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
                next: result.page < result.totalPages ? `${baseUrl}?page=${result.page + 1}&limit=${result.limit}` : null,
                prev: result.page > 1 ? `${baseUrl}?page=${result.page - 1}&limit=${result.limit}` : null,
                first: `${baseUrl}?page=1&limit=${result.limit}`,
                last: `${baseUrl}?page=${result.totalPages}&limit=${result.limit}`,
            },
        })
    }
}
