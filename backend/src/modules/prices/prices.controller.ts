import type { FastifyReply, FastifyRequest } from 'fastify'
import { PricesService } from './prices.service.js'
import type { PaginationQuery } from './prices.schema.js'

export class PricesController {
    constructor(private readonly service: PricesService) { }

    async getPrices(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const prices = await this.service.getPrices(request.query)
        return reply.status(200).send(prices)
    }

    async getRanks(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const ranks = await this.service.getRanks(request.query)
        return reply.status(200).send(ranks)
    }
}
