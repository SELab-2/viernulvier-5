import type { FastifyReply, FastifyRequest } from 'fastify'
import { UitdatabankService } from './uitdatabank.service.js'
import type { PaginationQuery } from './uitdatabank.schema.js'

export class UitdatabankController {
    constructor(private readonly service: UitdatabankService) { }

    async getKeywords(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const keywords = await this.service.getKeywords(request.query)
        return reply.status(200).send(keywords)
    }

    async getKeyword(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const keyword = await this.service.getKeyword(id)

        if (!keyword) {
            return reply.status(404).send({ message: 'Keyword not found' })
        }

        return reply.status(200).send(keyword)
    }

    async getThemes(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const themes = await this.service.getThemes(request.query)
        return reply.status(200).send(themes)
    }

    async getTheme(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const theme = await this.service.getTheme(id)

        if (!theme) {
            return reply.status(404).send({ message: 'Theme not found' })
        }

        return reply.status(200).send(theme)
    }

    async getTypes(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const types = await this.service.getTypes(request.query)
        return reply.status(200).send(types)
    }

    async getType(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const type = await this.service.getType(id)

        if (!type) {
            return reply.status(404).send({ message: 'Type not found' })
        }

        return reply.status(200).send(type)
    }
}
