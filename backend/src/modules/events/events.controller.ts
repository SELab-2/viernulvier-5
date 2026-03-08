import type { FastifyReply, FastifyRequest } from 'fastify'
import { EventsService } from './events.service.js'
import type { PaginationQuery, UpdateEventInput, CreateEventInput } from './events.schema.js'

export class EventsController {
    constructor(private readonly service: EventsService) { }

    async getEvents(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const events = await this.service.getEvents(request.query)
        return reply.status(200).send(events)
    }

    async getEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const event = await this.service.getEvent(id)

        if (!event) {
            return reply.status(404).send({ message: 'Event not found' })
        }

        return reply.status(200).send(event)
    }

    async getPrices(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const prices = await this.service.getPrices(request.query)
        return reply.status(200).send(prices)
    }

    async getEventPrice(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const price = await this.service.getEventPrice(id)

        if (!price) {
            return reply.status(404).send({ message: 'Event price not found' })
        }

        return reply.status(200).send(price)
    }

    async createEvent(request: FastifyRequest<{ Body: CreateEventInput }>, reply: FastifyReply) {
        const event = await this.service.createEvent(request.body)
        return reply.status(201).send(event)
    }

    async updateEvent(request: FastifyRequest<{ Params: { id: string }, Body: UpdateEventInput }>, reply: FastifyReply) {
        const { id } = request.params
        const event = await this.service.updateEvent(id, request.body)
        return reply.status(200).send(event)
    }

    async deleteEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteEvent(id)
        return reply.status(204).send()
    }
}
