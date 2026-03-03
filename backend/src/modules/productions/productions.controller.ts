import type { FastifyReply, FastifyRequest } from 'fastify'
import { ProductionsService } from './productions.service.js'
import type { PaginationQuery } from './productions.schema.js'

export class ProductionsController {
    constructor(private readonly service: ProductionsService) { }

    async getProductions(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const productions = await this.service.getProductions(request.query)
        return reply.status(200).send(productions)
    }
}
