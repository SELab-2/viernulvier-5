import type { FastifyReply, FastifyRequest } from 'fastify'
import { MediaService } from './media.service.js'
import type { PaginationQuery } from './media.schema.js'

export class MediaController {
    constructor(private readonly service: MediaService) { }

    async getGalleries(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const result = await this.service.getGalleries(request.query)
        return reply.status(200).send(result)
    }

    async getItems(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const result = await this.service.getItems(request.query)
        return reply.status(200).send(result)
    }

    async getCrops(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const result = await this.service.getCrops(request.query)
        return reply.status(200).send(result)
    }
}
