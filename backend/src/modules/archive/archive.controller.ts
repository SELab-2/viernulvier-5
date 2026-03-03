import { ArchiveService } from './archive.service.js'

/**
 * Archive Controller
 *
 * Controllers extract data from HTTP requests, call services,
 * and format HTTP responses. No business logic, no database access.
 */
export class ArchiveController {
    constructor(private readonly service: ArchiveService) { }

<<<<<<< HEAD
    // TODO: implement real handler methods, e.g.:
    // async getProductions(request: FastifyRequest, reply: FastifyReply) { ... }
    // async getProductionById(request: FastifyRequest, reply: FastifyReply) { ... }
=======
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
>>>>>>> 45610ee (Events, locations en genre toegevoegd)
}
