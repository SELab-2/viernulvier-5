import type { FastifyReply, FastifyRequest } from 'fastify'
import { ProductionsService } from './productions.service.js'
import type { PaginationQuery, UpdateProductionInput, CreateProductionInput } from './productions.schema.js'

export class ProductionsController {
    constructor(private readonly service: ProductionsService) { }

    async getProductions(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const productions = await this.service.getProductions(request.query)
        return reply.status(200).send(productions)
    }

    async getProduction(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const production = await this.service.getProduction(id)

        if (!production) {
            return reply.status(404).send({ message: 'Production not found' })
        }

        return reply.status(200).send(production)
    }

    async createProduction(request: FastifyRequest<{ Body: CreateProductionInput }>, reply: FastifyReply) {
        const production = await this.service.createProduction(request.body)
        return reply.status(201).send(production)
    }

    async updateProduction(request: FastifyRequest<{ Params: { id: string }, Body: UpdateProductionInput }>, reply: FastifyReply) {
        const { id } = request.params
        const production = await this.service.updateProduction(id, request.body)
        return reply.status(200).send(production)
    }
}
