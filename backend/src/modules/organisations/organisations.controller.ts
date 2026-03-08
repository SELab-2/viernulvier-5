import type { FastifyReply, FastifyRequest } from 'fastify'
import { OrganisationsService } from './organisations.service.js'
import type { PaginationQuery, CreateOrganisationInput, UpdateOrganisationInput } from './organisations.schema.js'

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

    async createOrganisation(request: FastifyRequest<{ Body: CreateOrganisationInput }>, reply: FastifyReply) {
        const organisation = await this.service.createOrganisation(request.body)
        return reply.status(201).send(organisation)
    }

    async updateOrganisation(request: FastifyRequest<{ Params: { id: string }, Body: UpdateOrganisationInput }>, reply: FastifyReply) {
        const { id } = request.params
        const organisation = await this.service.updateOrganisation(id, request.body)
        return reply.status(200).send(organisation)
    }

    async deleteOrganisation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteOrganisation(id)
        return reply.status(204).send()
    }
}
