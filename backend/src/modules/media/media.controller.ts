import type { FastifyReply, FastifyRequest } from 'fastify'
import { MediaService } from './media.service.js'
import type { 
    PaginationQuery, 
    CreateGalleryInput, 
    UpdateGalleryInput, 
    CreateItemInput, 
    UpdateItemInput, 
    CreateCropInput, 
    UpdateCropInput 
} from './media.schema.js'

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

    async createGallery(request: FastifyRequest<{ Body: CreateGalleryInput }>, reply: FastifyReply) {
        const gallery = await this.service.createGallery(request.body)
        return reply.status(201).send(gallery)
    }

    async updateGallery(request: FastifyRequest<{ Params: { id: string }, Body: UpdateGalleryInput }>, reply: FastifyReply) {
        const { id } = request.params
        const gallery = await this.service.updateGallery(id, request.body)
        return reply.status(200).send(gallery)
    }

    async deleteGallery(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteGallery(id)
        return reply.status(204).send()
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

    async createItem(request: FastifyRequest<{ Body: CreateItemInput }>, reply: FastifyReply) {
        const item = await this.service.createItem(request.body)
        return reply.status(201).send(item)
    }

    async updateItem(request: FastifyRequest<{ Params: { id: string }, Body: UpdateItemInput }>, reply: FastifyReply) {
        const { id } = request.params
        const item = await this.service.updateItem(id, request.body)
        return reply.status(200).send(item)
    }

    async deleteItem(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteItem(id)
        return reply.status(204).send()
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

    async createCrop(request: FastifyRequest<{ Body: CreateCropInput }>, reply: FastifyReply) {
        const crop = await this.service.createCrop(request.body)
        return reply.status(201).send(crop)
    }

    async updateCrop(request: FastifyRequest<{ Params: { id: string }, Body: UpdateCropInput }>, reply: FastifyReply) {
        const { id } = request.params
        const crop = await this.service.updateCrop(id, request.body)
        return reply.status(200).send(crop)
    }

    async deleteCrop(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteCrop(id)
        return reply.status(204).send()
    }
}
