import type { FastifyReply, FastifyRequest } from 'fastify'
import { OrganisationsService } from './organisations.service.js'
import type { PaginationQuery } from './organisations.schema.js'

export class OrganisationsController {
    constructor(private readonly service: OrganisationsService) { }

    async getOrganisations(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const result = await this.service.getOrganisations(request.query)
        return reply.status(200).send(result)
    }
}
