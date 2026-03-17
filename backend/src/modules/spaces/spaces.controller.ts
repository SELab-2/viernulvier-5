import type { FastifyReply, FastifyRequest } from 'fastify'
import { SpacesService } from './spaces.service.js'
import type { 
    PaginationQuery, 
    CreateSpaceInput, 
    UpdateSpaceInput 
} from './spaces.schema.js'

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

    async createSpace(request: FastifyRequest<{ Body: CreateSpaceInput }>, reply: FastifyReply) {
        const space = await this.service.createSpace(request.body)
        return reply.status(201).send(space)
    }

    async updateSpace(request: FastifyRequest<{ Params: { id: string }, Body: UpdateSpaceInput }>, reply: FastifyReply) {
        const { id } = request.params
        const space = await this.service.updateSpace(id, request.body)
        return reply.status(200).send(space)
    }

    async deleteSpace(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteSpace(id)
        return reply.status(204).send()
    }
}
