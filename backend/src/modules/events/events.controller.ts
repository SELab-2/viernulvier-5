import type { FastifyReply, FastifyRequest } from 'fastify'
import { EventsService } from './events.service.js'
import type { PaginationQuery } from './events.schema.js'

export class EventsController {
    constructor(private readonly service: EventsService) { }

    async getEvents(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const events = await this.service.getEvents(request.query)
        return reply.status(200).send(events)
    }

    async getPrices(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const prices = await this.service.getPrices(request.query)
        return reply.status(200).send(prices)
    }

    async getStatuses(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const statuses = await this.service.getStatuses(request.query)
        return reply.status(200).send(statuses)
    }
}
