import type { FastifyReply, FastifyRequest } from 'fastify'
import { MediaService } from './media.service.js'
import type { PaginationQuery } from './media.schema.js'

export class MediaController {
    constructor(private readonly service: MediaService) { }

    async getGalleries(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const result = await this.service.getGalleries(request.query)
        return reply.status(200).send(result)
    }

    async getGallery(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const gallery = await this.service.getGallery(id)

        if (!gallery) {
            return reply.status(404).send({ message: 'Gallery not found' })
        }

        return reply.status(200).send(gallery)
    }

    async getItems(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const result = await this.service.getItems(request.query)
        return reply.status(200).send(result)
    }

    async getItem(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const item = await this.service.getItem(id)

        if (!item) {
            return reply.status(404).send({ message: 'Media item not found' })
        }

        return reply.status(200).send(item)
    }

    async getCrops(request: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) {
        const result = await this.service.getCrops(request.query)
        return reply.status(200).send(result)
    }

    async getCrop(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const crop = await this.service.getCrop(id)

        if (!crop) {
            return reply.status(404).send({ message: 'Crop not found' })
        }

        return reply.status(200).send(crop)
    }
}
