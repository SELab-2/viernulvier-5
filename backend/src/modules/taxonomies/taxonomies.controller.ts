import type { FastifyReply, FastifyRequest } from 'fastify'
import { TaxonomiesService } from './taxonomies.service.js'
import type { 
    PaginationQuery, 
    CreateGenreInput, 
    UpdateGenreInput, 
    CreateTagInput, 
    UpdateTagInput 
} from './taxonomies.schema.js'

export class TaxonomiesController {
    constructor(private readonly service: TaxonomiesService) { }

    async getGenres(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const genres = await this.service.getGenres(request.query)
        return reply.status(200).send(genres)
    }

    async getGenre(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const genre = await this.service.getGenre(id)

        if (!genre) {
            return reply.status(404).send({ message: 'Genre not found' })
        }

        return reply.status(200).send(genre)
    }

    async createGenre(request: FastifyRequest<{ Body: CreateGenreInput }>, reply: FastifyReply) {
        const genre = await this.service.createGenre(request.body)
        return reply.status(201).send(genre)
    }

    async updateGenre(request: FastifyRequest<{ Params: { id: string }, Body: UpdateGenreInput }>, reply: FastifyReply) {
        const { id } = request.params
        const genre = await this.service.updateGenre(id, request.body)
        return reply.status(200).send(genre)
    }

    async deleteGenre(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteGenre(id)
        return reply.status(204).send()
    }

    async getTags(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const tags = await this.service.getTags(request.query)
        return reply.status(200).send(tags)
    }

    async getTag(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const tag = await this.service.getTag(id)

        if (!tag) {
            return reply.status(404).send({ message: 'Tag not found' })
        }

        return reply.status(200).send(tag)
    }

    async createTag(request: FastifyRequest<{ Body: CreateTagInput }>, reply: FastifyReply) {
        const tag = await this.service.createTag(request.body)
        return reply.status(201).send(tag)
    }

    async updateTag(request: FastifyRequest<{ Params: { id: string }, Body: UpdateTagInput }>, reply: FastifyReply) {
        const { id } = request.params
        const tag = await this.service.updateTag(id, request.body)
        return reply.status(200).send(tag)
    }

    async deleteTag(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteTag(id)
        return reply.status(204).send()
    }
}
