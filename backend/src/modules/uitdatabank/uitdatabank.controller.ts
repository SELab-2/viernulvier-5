import type { FastifyReply, FastifyRequest } from 'fastify'
import { UitdatabankService } from './uitdatabank.service.js'
import type { PaginationQuery } from './uitdatabank.schema.js'

export class UitdatabankController {
    constructor(private readonly service: UitdatabankService) { }

    async getKeywords(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const keywords = await this.service.getKeywords(request.query)
        return reply.status(200).send(keywords)
    }

    async getThemes(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const themes = await this.service.getThemes(request.query)
        return reply.status(200).send(themes)
    }

    async getTypes(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const types = await this.service.getTypes(request.query)
        return reply.status(200).send(types)
    }
}
