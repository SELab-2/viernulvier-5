import type { FastifyReply, FastifyRequest } from 'fastify'
import { SpacesService } from './spaces.service.js'
import type { PaginationQuery } from './spaces.schema.js'

export class SpacesController {
    constructor(private readonly service: SpacesService) { }

    async getSpaces(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const spaces = await this.service.getSpaces(request.query)
        return reply.status(200).send(spaces)
    }

    async getSpace(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const space = await this.service.getSpace(id)

        if (!space) {
            return reply.status(404).send({ message: 'Space not found' })
        }

        return reply.status(200).send(space)
    }
}
