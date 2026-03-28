import type { FastifyReply, FastifyRequest } from 'fastify'
import { EventsService } from './events.service.js'
import type { 
    EventPaginationQuery, 
    EventPricePaginationQuery, 
    UpdateEventInput, 
    CreateEventInput, 
    EventResponse, 
    EventPriceResponse 
} from './events.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class EventsController {
    constructor(private readonly service: EventsService) { }

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive`
    }

    private mapEventLinks(event: any, baseUrl: string): EventResponse {
        return {
            ...event,
            links: {
                self: `${baseUrl}/events/${event.id}`,
                production: event.production_id ? `${baseUrl}/productions/${event.production_id}` : undefined,
                hall: event.hall_id ? `${baseUrl}/halls/${event.hall_id}` : undefined,
                prices: `${baseUrl}/events/prices?eventId=${event.id}`,
            }
        }
    }

    private mapEventPriceLinks(price: any, baseUrl: string): EventPriceResponse {
        return {
            ...price,
            links: {
                self: `${baseUrl}/events/prices/${price.id}`,
                event: price.event_id ? `${baseUrl}/events/${price.event_id}` : undefined,
            }
        }
    }

    async getEvents(request: FastifyRequest<{ Querystring: EventPaginationQuery }>, reply: FastifyReply) {
        const events = await this.service.getEvents(request.query)
        const baseUrl = this.getBaseUrl(request)
        const host = request.headers.host || request.hostname
        const currentUrl = `${request.protocol}://${host}${request.url.split('?')[0]}`

        const dataWithLinks = events.items.map(e => this.mapEventLinks(e, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: events.total,
                page: events.page,
                limit: events.limit,
                totalPages: events.totalPages,
            },
            links: buildPaginationLinks(currentUrl, events.page, events.limit, events.totalPages)
        })
    }

    async getEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const event = await this.service.getEvent(id)

        if (!event) {
            return reply.status(404).send({ message: 'Event not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapEventLinks(event, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/events/${id}`
            }
        })
    }

    async getPrices(request: FastifyRequest<{ Querystring: EventPricePaginationQuery }>, reply: FastifyReply) {
        const prices = await this.service.getPrices(request.query)
        const baseUrl = this.getBaseUrl(request)
        const host = request.headers.host || request.hostname
        const currentUrl = `${request.protocol}://${host}${request.url.split('?')[0]}`

        const dataWithLinks = prices.items.map(p => this.mapEventPriceLinks(p, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: prices.total,
                page: prices.page,
                limit: prices.limit,
                totalPages: prices.totalPages,
            },
            links: buildPaginationLinks(currentUrl, prices.page, prices.limit, prices.totalPages)
        })
    }

    async getEventPrice(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const price = await this.service.getEventPrice(id)

        if (!price) {
            return reply.status(404).send({ message: 'Event price not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapEventPriceLinks(price, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/events/prices/${id}`
            }
        })
    }

    async createEvent(request: FastifyRequest<{ Body: CreateEventInput }>, reply: FastifyReply) {
        const event = await this.service.createEvent(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/events/${event.id}`
        const dataWithLinks = this.mapEventLinks(event, baseUrl)

        return reply
            .status(201)
            .header('Location', selfUrl)
            .send({
                data: dataWithLinks,
                links: {
                    self: selfUrl
                }
            })
    }

    async updateEvent(request: FastifyRequest<{ Params: { id: string }, Body: UpdateEventInput }>, reply: FastifyReply) {
        const { id } = request.params
        const event = await this.service.updateEvent(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapEventLinks(event, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/events/${id}`
            }
        })
    }

    async deleteEvent(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteEvent(id)
        return reply.status(204).send()
    }
}
