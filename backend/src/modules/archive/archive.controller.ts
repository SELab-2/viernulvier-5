import type { FastifyReply, FastifyRequest } from 'fastify'
import { ArchiveService } from './archive.service.js'
import type { PaginationQuery } from './archive.schema.js'

export class ArchiveController {
    constructor(private readonly service: ArchiveService) { }

    /**
     * Handle HTTP GET request for production list.
     */
    async getProductions(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const productions = await this.service.getProductions(request.query)
        return reply.status(200).send(productions)
    }

    /**
     * Handle HTTP GET request for event list.
     */
    async getEvents(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const events = await this.service.getEvents(request.query)
        return reply.status(200).send(events)
    }

    /**
     * Handle HTTP GET request for genre list.
     */
    async getGenres(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const genres = await this.service.getGenres(request.query)
        return reply.status(200).send(genres)
    }

    /**
     * Handle HTTP GET request for location list.
     */
    async getLocations(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const locations = await this.service.getLocations(request.query)
        return reply.status(200).send(locations)
    }

    /**
     * Handle HTTP GET request for tag list.
     */
    async getTags(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const tags = await this.service.getTags(request.query)
        return reply.status(200).send(tags)
    }
}
