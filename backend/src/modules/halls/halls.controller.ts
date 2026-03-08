import type { FastifyReply, FastifyRequest } from 'fastify'
import { HallsService } from './halls.service.js'
import type { 
    PaginationQuery, 
    CreateHallInput, 
    UpdateHallInput 
} from './halls.schema.js'

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

    async createHall(request: FastifyRequest<{ Body: CreateHallInput }>, reply: FastifyReply) {
        const hall = await this.service.createHall(request.body)
        return reply.status(201).send(hall)
    }

    async updateHall(request: FastifyRequest<{ Params: { id: string }, Body: UpdateHallInput }>, reply: FastifyReply) {
        const { id } = request.params
        const hall = await this.service.updateHall(id, request.body)
        return reply.status(200).send(hall)
    }

    async deleteHall(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteHall(id)
        return reply.status(204).send()
    }
}
