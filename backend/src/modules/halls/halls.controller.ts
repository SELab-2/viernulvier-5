import type { FastifyReply, FastifyRequest } from 'fastify'
import { HallsService } from './halls.service.js'
import type { PaginationQuery } from './halls.schema.js'

export class HallsController {
    constructor(private readonly service: HallsService) { }

    async getHalls(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const halls = await this.service.getHalls(request.query)
        return reply.status(200).send(halls)
    }
}
