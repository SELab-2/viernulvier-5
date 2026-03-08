import type { FastifyReply, FastifyRequest } from 'fastify'
import { OrganisationsService } from './organisations.service.js'
import type { PaginationQuery } from './organisations.schema.js'

export class OrganisationsController {
    constructor(private readonly service: OrganisationsService) { }

    async getOrganisations(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const result = await this.service.getOrganisations(request.query)
        return reply.status(200).send(result)
    }

    async getOrganisation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const organisation = await this.service.getOrganisation(id)

        if (!organisation) {
            return reply.status(404).send({ message: 'Organisation not found' })
        }

        return reply.status(200).send(organisation)
    }
}
