import type { FastifyReply, FastifyRequest } from 'fastify'
import { SpacesService } from './spaces.service.js'
import type { PaginationQuery } from './spaces.schema.js'

export class SpacesController {
    constructor(private readonly service: SpacesService) { }

    async getSpaces(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const spaces = await this.service.getSpaces(request.query)
        return reply.status(200).send(spaces)
    }
}
