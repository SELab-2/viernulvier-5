import type { FastifyReply, FastifyRequest } from 'fastify'
import { LocationsService } from './locations.service.js'
import type { PaginationQuery } from './locations.schema.js'

export class LocationsController {
    constructor(private readonly service: LocationsService) { }

    async getLocations(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const locations = await this.service.getLocations(request.query)
        return reply.status(200).send(locations)
    }
}
