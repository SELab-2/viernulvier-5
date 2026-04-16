import type { FastifyReply, FastifyRequest } from 'fastify'
import { TaxonomiesService } from './taxonomies.service.js'
import type { 
    GenrePaginationQuery,
    TagPaginationQuery,
    GenreResponse,
    TagResponse,
    CreateGenreInput,
    UpdateGenreInput,
    CreateTagInput,
    UpdateTagInput
} from './taxonomies.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class TaxonomiesController {
    constructor(private readonly service: TaxonomiesService) { }

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive`
    }

    private mapGenreLinks(genre: any, baseUrl: string): GenreResponse {
        return {
            ...genre,
            links: {
                self: `${baseUrl}/genres/${genre.id}`,
                productions: `${baseUrl}/productions?genreId=${genre.id}`,
            }
        }
    }

    private mapTagLinks(tag: any, baseUrl: string): TagResponse {
        return {
            ...tag,
            links: {
                self: `${baseUrl}/tags/${tag.id}`,
                gallery: tag.gallery_id ? `${baseUrl}/media/galleries/${tag.gallery_id}` : null,
            }
        }
    }

    // --- Genres ---

    async getGenres(request: FastifyRequest<{ Querystring: GenrePaginationQuery }>, reply: FastifyReply) {
        const genres = await this.service.getGenres(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/genres`

        const dataWithLinks = genres.items.map(g => this.mapGenreLinks(g, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: genres.total,
                page: genres.page,
                limit: genres.limit,
                totalPages: genres.totalPages,
            },
            links: buildPaginationLinks(currentUrl, genres.page, genres.limit, genres.totalPages)
        })
    }

    async getGenre(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const genre = await this.service.getGenre(id)

        if (!genre) {
            return reply.status(404).send({ message: 'Genre not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapGenreLinks(genre, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/genres/${id}`
            }
        })
    }

    async createGenre(request: FastifyRequest<{ Body: CreateGenreInput }>, reply: FastifyReply) {
        const genre = await this.service.createGenre(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/genres/${genre.id}`
        
        const dataWithLinks = this.mapGenreLinks(genre, baseUrl)

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

    async updateGenre(request: FastifyRequest<{ Params: { id: string }, Body: UpdateGenreInput }>, reply: FastifyReply) {
        const { id } = request.params
        const genre = await this.service.updateGenre(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapGenreLinks(genre, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/genres/${id}`
            }
        })
    }

    async deleteGenre(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteGenre(id)
        return reply.status(204).send()
    }

    // --- Tags ---

    async getTags(request: FastifyRequest<{ Querystring: TagPaginationQuery }>, reply: FastifyReply) {
        const tags = await this.service.getTags(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/tags`

        const dataWithLinks = tags.items.map(t => this.mapTagLinks(t, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: tags.total,
                page: tags.page,
                limit: tags.limit,
                totalPages: tags.totalPages,
            },
            links: buildPaginationLinks(currentUrl, tags.page, tags.limit, tags.totalPages)
        })
    }

    async getTag(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const tag = await this.service.getTag(id)

        if (!tag) {
            return reply.status(404).send({ message: 'Tag not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapTagLinks(tag, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/tags/${id}`
            }
        })
    }

    async createTag(request: FastifyRequest<{ Body: CreateTagInput }>, reply: FastifyReply) {
        const tag = await this.service.createTag(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/tags/${tag.id}`
        
        const dataWithLinks = this.mapTagLinks(tag, baseUrl)

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

    async updateTag(request: FastifyRequest<{ Params: { id: string }, Body: UpdateTagInput }>, reply: FastifyReply) {
        const { id } = request.params
        const tag = await this.service.updateTag(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapTagLinks(tag, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/tags/${id}`
            }
        })
    }

    async deleteTag(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteTag(id)
        return reply.status(204).send()
    }
}
