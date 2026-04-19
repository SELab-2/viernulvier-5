import type { FastifyReply, FastifyRequest } from 'fastify'
import { MediaService } from './media.service.js'
import type { 
    GalleryPaginationQuery,
    ItemPaginationQuery,
    CropPaginationQuery,
    GalleryResponse, 
    ItemResponse, 
    CropResponse,
    CreateGalleryInput,
    UpdateGalleryInput,
    CreateItemInput,
    UpdateItemInput,
    CreateCropInput,
    UpdateCropInput
} from './media.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class MediaController {
    constructor(private readonly service: MediaService) { }

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive/media`
    }

    private mapGalleryLinks(gallery: any, baseUrl: string): GalleryResponse {
        return {
            ...gallery,
            links: {
                self: `${baseUrl}/galleries/${gallery.id}`,
                items: `${baseUrl}/items?galleryId=${gallery.id}`,
            }
        }
    }

    private mapItemLinks(item: any, baseUrl: string): ItemResponse {
        return {
            ...item,
            links: {
                self: `${baseUrl}/items/${item.id}`,
                gallery: item.gallery_id ? `${baseUrl}/galleries/${item.gallery_id}` : null,
                crops: `${baseUrl}/items/crops?itemId=${item.id}`,
            }
        }
    }

    private mapCropLinks(crop: any, baseUrl: string): CropResponse {
        return {
            ...crop,
            links: {
                self: `${baseUrl}/items/crops/${crop.id}`,
                item: crop.item_id ? `${baseUrl}/items/${crop.item_id}` : null,
            }
        }
    }

    // --- Galleries ---

    async getGalleries(request: FastifyRequest<{ Querystring: GalleryPaginationQuery }>, reply: FastifyReply) {
        const galleries = await this.service.getGalleries(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/galleries`

        const dataWithLinks = galleries.items.map(g => this.mapGalleryLinks(g, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: galleries.total,
                page: galleries.page,
                limit: galleries.limit,
                totalPages: galleries.totalPages,
            },
            links: buildPaginationLinks(currentUrl, galleries.page, galleries.limit, galleries.totalPages)
        })
    }

    async getGallery(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const gallery = await this.service.getGallery(id)

        if (!gallery) {
            return reply.status(404).send({ message: 'Gallery not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapGalleryLinks(gallery, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/galleries/${id}`
            }
        })
    }

    async createGallery(request: FastifyRequest<{ Body: CreateGalleryInput }>, reply: FastifyReply) {
        const gallery = await this.service.createGallery(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/galleries/${gallery.id}`
        
        const dataWithLinks = this.mapGalleryLinks(gallery, baseUrl)

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

    async updateGallery(request: FastifyRequest<{ Params: { id: string }, Body: UpdateGalleryInput }>, reply: FastifyReply) {
        const { id } = request.params
        const gallery = await this.service.updateGallery(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapGalleryLinks(gallery, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/galleries/${id}`
            }
        })
    }

    async deleteGallery(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteGallery(id)
        return reply.status(204).send()
    }

    // --- Items ---

    async getItems(request: FastifyRequest<{ Querystring: ItemPaginationQuery }>, reply: FastifyReply) {
        const items = await this.service.getItems(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/items`

        const dataWithLinks = items.items.map(i => this.mapItemLinks(i, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: items.total,
                page: items.page,
                limit: items.limit,
                totalPages: items.totalPages,
            },
            links: buildPaginationLinks(currentUrl, items.page, items.limit, items.totalPages)
        })
    }

    async getItem(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const item = await this.service.getItem(id)

        if (!item) {
            return reply.status(404).send({ message: 'Media item not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapItemLinks(item, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/items/${id}`
            }
        })
    }

    async createItem(request: FastifyRequest<{ Body: CreateItemInput }>, reply: FastifyReply) {
        const item = await this.service.createItem(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/items/${item.id}`
        
        const dataWithLinks = this.mapItemLinks(item, baseUrl)

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

    async updateItem(request: FastifyRequest<{ Params: { id: string }, Body: UpdateItemInput }>, reply: FastifyReply) {
        const { id } = request.params
        const item = await this.service.updateItem(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapItemLinks(item, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/items/${id}`
            }
        })
    }

    async deleteItem(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteItem(id)
        return reply.status(204).send()
    }

    // --- Crops ---

    async getCrops(request: FastifyRequest<{ Querystring: CropPaginationQuery }>, reply: FastifyReply) {
        const crops = await this.service.getCrops(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/items/crops`

        const dataWithLinks = crops.items.map(c => this.mapCropLinks(c, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: crops.total,
                page: crops.page,
                limit: crops.limit,
                totalPages: crops.totalPages,
            },
            links: buildPaginationLinks(currentUrl, crops.page, crops.limit, crops.totalPages)
        })
    }

    async getCrop(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const crop = await this.service.getCrop(id)

        if (!crop) {
            return reply.status(404).send({ message: 'Crop not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapCropLinks(crop, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/items/crops/${id}`
            }
        })
    }

    async createCrop(request: FastifyRequest<{ Body: CreateCropInput }>, reply: FastifyReply) {
        const crop = await this.service.createCrop(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/items/crops/${crop.id}`
        
        const dataWithLinks = this.mapCropLinks(crop, baseUrl)

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

    async updateCrop(request: FastifyRequest<{ Params: { id: string }, Body: UpdateCropInput }>, reply: FastifyReply) {
        const { id } = request.params
        const crop = await this.service.updateCrop(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapCropLinks(crop, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/items/crops/${id}`
            }
        })
    }

    async deleteCrop(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteCrop(id)
        return reply.status(204).send()
    }
}
