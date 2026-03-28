import type { FastifyReply, FastifyRequest } from 'fastify'
import { LocationsService } from './locations.service.js'
import type { 
    LocationPaginationQuery, 
    CreateLocationInput, 
    UpdateLocationInput,
    LocationResponse
} from './locations.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class LocationsController {
    constructor(private readonly service: LocationsService) { }

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive`
    }

    private mapLocationLinks(location: any, baseUrl: string): LocationResponse {
        return {
            ...location,
            links: {
                self: `${baseUrl}/locations/${location.id}`,
                spaces: `${baseUrl}/spaces?locationId=${location.id}`,
            }
        }
    }

    async getLocations(request: FastifyRequest<{ Querystring: LocationPaginationQuery }>, reply: FastifyReply) {
        const locations = await this.service.getLocations(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/locations`

        const dataWithLinks = locations.items.map(l => this.mapLocationLinks(l, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: locations.total,
                page: locations.page,
                limit: locations.limit,
                totalPages: locations.totalPages,
            },
            links: buildPaginationLinks(currentUrl, locations.page, locations.limit, locations.totalPages)
        })
    }

    async getLocation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const location = await this.service.getLocation(id)

        if (!location) {
            return reply.status(404).send({ message: 'Location not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapLocationLinks(location, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/locations/${id}`
            }
        })
    }

    async createLocation(request: FastifyRequest<{ Body: CreateLocationInput }>, reply: FastifyReply) {
        const location = await this.service.createLocation(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/locations/${location.id}`
        
        const dataWithLinks = this.mapLocationLinks(location, baseUrl)

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

    async updateLocation(request: FastifyRequest<{ Params: { id: string }, Body: UpdateLocationInput }>, reply: FastifyReply) {
        const { id } = request.params
        const location = await this.service.updateLocation(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapLocationLinks(location, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/locations/${id}`
            }
        })
    }

    async deleteLocation(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteLocation(id)
        return reply.status(204).send()
    }
}
