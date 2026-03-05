import type { FastifyReply, FastifyRequest } from 'fastify'
import { TaxonomiesService } from './taxonomies.service.js'
import type { PaginationQuery } from './taxonomies.schema.js'

export class TaxonomiesController {
    constructor(private readonly service: TaxonomiesService) { }

    async getGenres(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const genres = await this.service.getGenres(request.query)
        return reply.status(200).send(genres)
    }

    async getTags(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const tags = await this.service.getTags(request.query)
        return reply.status(200).send(tags)
    }
}
