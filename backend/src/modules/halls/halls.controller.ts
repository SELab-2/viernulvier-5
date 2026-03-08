import type { FastifyReply, FastifyRequest } from 'fastify'
import { HallsService } from './halls.service.js'
import type { PaginationQuery } from './halls.schema.js'

export class HallsController {
    constructor(private readonly service: HallsService) { }

    async getHalls(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const halls = await this.service.getHalls(request.query)
        return reply.status(200).send(halls)
    }

    async getHall(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const hall = await this.service.getHall(id)

        if (!hall) {
            return reply.status(404).send({ message: 'Hall not found' })
        }

        return reply.status(200).send(hall)
    }
}
