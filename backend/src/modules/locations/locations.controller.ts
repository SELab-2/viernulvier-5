import type { FastifyReply, FastifyRequest } from 'fastify'
import { LocationsService } from './locations.service.js'
import type { 
    PaginationQuery, 
    CreateLocationInput, 
    UpdateLocationInput 
} from './locations.schema.js'

export class LocationsController {
    constructor(private readonly service: LocationsService) { }

    async getLocations(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const locations = await this.service.getLocations(request.query)
        return reply.status(200).send(locations)
    }

    async getLocation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const location = await this.service.getLocation(id)

        if (!location) {
            return reply.status(404).send({ message: 'Location not found' })
        }

        return reply.status(200).send(location)
    }

    async createLocation(request: FastifyRequest<{ Body: CreateLocationInput }>, reply: FastifyReply) {
        const location = await this.service.createLocation(request.body)
        return reply.status(201).send(location)
    }

    async updateLocation(request: FastifyRequest<{ Params: { id: string }, Body: UpdateLocationInput }>, reply: FastifyReply) {
        const { id } = request.params
        const location = await this.service.updateLocation(id, request.body)
        return reply.status(200).send(location)
    }

    async deleteLocation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteLocation(id)
        return reply.status(204).send()
    }

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
