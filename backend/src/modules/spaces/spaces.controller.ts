import type { FastifyReply, FastifyRequest } from 'fastify'
import { SpacesService } from './spaces.service.js'
import type { 
    SpacePaginationQuery, 
    CreateSpaceInput, 
    UpdateSpaceInput,
    SpaceResponse
} from './spaces.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class SpacesController {
    constructor(private readonly service: SpacesService) { }

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive`
    }

    private mapSpaceLinks(space: any, baseUrl: string): SpaceResponse {
        return {
            ...space,
            links: {
                self: `${baseUrl}/spaces/${space.id}`,
                location: space.location_id ? `${baseUrl}/locations/${space.location_id}` : null,
                halls: `${baseUrl}/halls?spaceId=${space.id}`,
            }
        }
    }

    async getSpaces(request: FastifyRequest<{ Querystring: SpacePaginationQuery }>, reply: FastifyReply) {
        const spaces = await this.service.getSpaces(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/spaces`

        const dataWithLinks = spaces.items.map(s => this.mapSpaceLinks(s, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: spaces.total,
                page: spaces.page,
                limit: spaces.limit,
                totalPages: spaces.totalPages,
            },
            links: buildPaginationLinks(currentUrl, spaces.page, spaces.limit, spaces.totalPages)
        })
    }

    async getSpace(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const space = await this.service.getSpace(id)

        if (!space) {
            return reply.status(404).send({ message: 'Space not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapSpaceLinks(space, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/spaces/${id}`
            }
        })
    }

    async createSpace(request: FastifyRequest<{ Body: CreateSpaceInput }>, reply: FastifyReply) {
        const space = await this.service.createSpace(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/spaces/${space.id}`
        
        const dataWithLinks = this.mapSpaceLinks(space, baseUrl)

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

    async updateSpace(request: FastifyRequest<{ Params: { id: string }, Body: UpdateSpaceInput }>, reply: FastifyReply) {
        const { id } = request.params
        const space = await this.service.updateSpace(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapSpaceLinks(space, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/spaces/${id}`
            }
        })
    }

    async deleteSpace(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteSpace(id)
        return reply.status(204).send()
    }
}
