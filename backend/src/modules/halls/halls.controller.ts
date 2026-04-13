import type { FastifyReply, FastifyRequest } from 'fastify'
import { HallsService } from './halls.service.js'
import type { 
    HallPaginationQuery, 
    CreateHallInput, 
    UpdateHallInput,
    HallResponse
} from './halls.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class HallsController {
    constructor(private readonly service: HallsService) { }

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive`
    }

    private mapHallLinks(hall: any, baseUrl: string): HallResponse {
        return {
            ...hall,
            links: {
                self: `${baseUrl}/halls/${hall.id}`,
                space: hall.space_id ? `${baseUrl}/spaces/${hall.space_id}` : undefined,
                events: `${baseUrl}/events?hallId=${hall.id}`,
            }
        }
    }

    async getHalls(request: FastifyRequest<{ Querystring: HallPaginationQuery }>, reply: FastifyReply) {
        const halls = await this.service.getHalls(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/halls`

        const dataWithLinks = halls.items.map(h => this.mapHallLinks(h, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: halls.total,
                page: halls.page,
                limit: halls.limit,
                totalPages: halls.totalPages,
            },
            links: buildPaginationLinks(currentUrl, halls.page, halls.limit, halls.totalPages)
        })
    }

    async getHall(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const hall = await this.service.getHall(id)

        if (!hall) {
            return reply.status(404).send({ message: 'Hall not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapHallLinks(hall, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/halls/${id}`
            }
        })
    }

    async createHall(request: FastifyRequest<{ Body: CreateHallInput }>, reply: FastifyReply) {
        const hall = await this.service.createHall(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/halls/${hall.id}`
        
        const dataWithLinks = this.mapHallLinks(hall, baseUrl)

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

    async updateHall(request: FastifyRequest<{ Params: { id: string }, Body: UpdateHallInput }>, reply: FastifyReply) {
        const { id } = request.params
        const hall = await this.service.updateHall(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapHallLinks(hall, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/halls/${id}`
            }
        })
    }

    async deleteHall(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteHall(id)
        return reply.status(204).send()
    }
}
