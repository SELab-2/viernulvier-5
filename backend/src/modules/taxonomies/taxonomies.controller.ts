import type { FastifyReply, FastifyRequest } from 'fastify'
import { TaxonomiesService } from './taxonomies.service.js'
import type { PaginationQuery } from './taxonomies.schema.js'

export class TaxonomiesController {
    constructor(private readonly service: TaxonomiesService) { }

    async getGenres(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const genres = await this.service.getGenres(request.query)
        return reply.status(200).send(genres)
    }

    async getGenre(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const genre = await this.service.getGenre(id)

        if (!genre) {
            return reply.status(404).send({ message: 'Genre not found' })
        }

        return reply.status(200).send(genre)
    }

    async getTags(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const tags = await this.service.getTags(request.query)
        return reply.status(200).send(tags)
    }

    async getTag(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const tag = await this.service.getTag(id)

        if (!tag) {
            return reply.status(404).send({ message: 'Tag not found' })
        }

        return reply.status(200).send(tag)
    }
}
