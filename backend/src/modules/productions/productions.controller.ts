import type { FastifyReply, FastifyRequest } from 'fastify'
import { ProductionsService } from './productions.service.js'
import type { PaginationQuery, UpdateProductionInput, CreateProductionInput, ProductionResponse } from './productions.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class ProductionsController {
        private extractImageUrl(production: any): string | undefined {
            const posterItem = production.poster_gallery?.items?.[0]
            const mediaItem = production.media_gallery?.items?.[0]

            const posterLink = posterItem?.link as any
            const mediaLink = mediaItem?.link as any

            if (typeof posterLink === 'string' && posterLink.trim().length > 0) {
                return posterLink
            }

            if (posterLink && typeof posterLink === 'object') {
                const fromPosterObject = posterLink.url || posterLink.src || posterLink.original
                if (typeof fromPosterObject === 'string' && fromPosterObject.trim().length > 0) {
                    return fromPosterObject
                }
            }

            if (typeof mediaLink === 'string' && mediaLink.trim().length > 0) {
                return mediaLink
            }

            if (mediaLink && typeof mediaLink === 'object') {
                const fromMediaObject = mediaLink.url || mediaLink.src || mediaLink.original
                if (typeof fromMediaObject === 'string' && fromMediaObject.trim().length > 0) {
                    return fromMediaObject
                }
            }

            const existingCustomData = production.custom_data
            if (
                existingCustomData &&
                typeof existingCustomData === 'object' &&
                typeof existingCustomData.image_url === 'string' &&
                existingCustomData.image_url.trim().length > 0
            ) {
                return existingCustomData.image_url
            }

            return undefined
        }

    constructor(private readonly service: ProductionsService) { }

    private getBaseUrl(request: FastifyRequest) {
        // Use the Host header to include the port (important for local dev on :3001)
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive`
    }

    /**
     * Maps a production to include its RESTful links.
     */
    private mapProductionLinks(production: any, baseUrl: string): ProductionResponse {
        const prodId = production.id
        const imageUrl = this.extractImageUrl(production)
        const customData = {
            ...(production.custom_data && typeof production.custom_data === 'object' ? production.custom_data : {}),
            ...(imageUrl ? { image_url: imageUrl } : {}),
        }
        
        return {
            ...production,
            custom_data: customData,
            links: {
                self: `${baseUrl}/productions/${prodId}`,
                events: `${baseUrl}/events?production_id=${prodId}`,
                media_gallery: production.media_gallery_id ? `${baseUrl}/media/galleries/${production.media_gallery_id}` : undefined,
                review_gallery: production.review_gallery_id ? `${baseUrl}/media/galleries/${production.review_gallery_id}` : undefined,
                poster_gallery: production.poster_gallery_id ? `${baseUrl}/media/galleries/${production.poster_gallery_id}` : undefined,
                uitdatabank_theme: production.uitdatabank_theme ? `${baseUrl}/uitdatabank/themes/${production.uitdatabank_theme}` : undefined,
                uitdatabank_type: production.uitdatabank_type ? `${baseUrl}/uitdatabank/types/${production.uitdatabank_type}` : undefined,
            }
        }
    }

    async getProductions(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const productions = await this.service.getProductions(request.query)
        const baseUrl = this.getBaseUrl(request)
        const host = request.headers.host || request.hostname
        const currentUrl = `${request.protocol}://${host}${request.url.split('?')[0]}`

        const dataWithLinks = productions.items.map(p => this.mapProductionLinks(p, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: productions.total,
                page: productions.page,
                limit: productions.limit,
                totalPages: productions.totalPages,
            },
            links: buildPaginationLinks(currentUrl, productions.page, productions.limit, productions.totalPages)
        })
    }

    async getProduction(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const production = await this.service.getProduction(id)

        if (!production) {
            return reply.status(404).send({ message: 'Production not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapProductionLinks(production, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/productions/${id}`
            }
        })
    }

    async createProduction(request: FastifyRequest<{ Body: CreateProductionInput }>, reply: FastifyReply) {
        const production = await this.service.createProduction(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/productions/${production.id}`
        
        const dataWithLinks = this.mapProductionLinks(production, baseUrl)

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

    async updateProduction(request: FastifyRequest<{ Params: { id: string }, Body: UpdateProductionInput }>, reply: FastifyReply) {
        const { id } = request.params
        const production = await this.service.updateProduction(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapProductionLinks(production, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/productions/${id}`
            }
        })
    }

    async deleteProduction(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteProduction(id)
        return reply.status(204).send()
    }
}
