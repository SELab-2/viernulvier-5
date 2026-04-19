import { MediaRepository } from './media.repository.js'
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
import { PaginatedResult, calculateTotalPages } from '../../utils/pagination.js'

export class MediaService {
    constructor(private readonly repository: MediaRepository) { }

    async getGalleries(options: GalleryPaginationQuery): Promise<PaginatedResult<GalleryResponse>> {
        const { page, limit, search, lang } = options
        const [items, total] = await Promise.all([
            this.repository.findAllGalleries({ page, limit, search, lang }),
            this.repository.countGalleries({ search, lang }),
        ])
        
        const totalPages = calculateTotalPages(total, limit)

        return {
            items: items as any,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async getGallery(id: string): Promise<GalleryResponse | null> {
        return this.repository.findGalleryById(id) as any
    }

    async createGallery(data: CreateGalleryInput): Promise<GalleryResponse> {
        return this.repository.createGallery(data) as any
    }

    async updateGallery(id: string, data: UpdateGalleryInput): Promise<GalleryResponse> {
        return this.repository.updateGallery(id, data) as any
    }

    async deleteGallery(id: string): Promise<void> {
        await this.repository.deleteGallery(id)
    }

    async getItems(options: ItemPaginationQuery): Promise<PaginatedResult<ItemResponse>> {
        const { page, limit, galleryId, search, lang } = options
        const [items, total] = await Promise.all([
            this.repository.findAllItems({ page, limit, galleryId, search, lang }),
            this.repository.countItems({ galleryId, search, lang }),
        ])

        const totalPages = calculateTotalPages(total, limit)

        return {
            items: items as any,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async getItem(id: string): Promise<ItemResponse | null> {
        return this.repository.findItemById(id) as any
    }

    async createItem(data: CreateItemInput): Promise<ItemResponse> {
        return this.repository.createItem(data) as any
    }

    async updateItem(id: string, data: UpdateItemInput): Promise<ItemResponse> {
        return this.repository.updateItem(id, data) as any
    }

    async deleteItem(id: string): Promise<void> {
        await this.repository.deleteItem(id)
    }

    async getCrops(options: CropPaginationQuery): Promise<PaginatedResult<CropResponse>> {
        const { page, limit, itemId, search, lang } = options
        const [items, total] = await Promise.all([
            this.repository.findAllCrops({ page, limit, itemId, search, lang }),
            this.repository.countCrops({ itemId, search, lang }),
        ])

        const totalPages = calculateTotalPages(total, limit)

        return {
            items: items as any,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async getCrop(id: string): Promise<CropResponse | null> {
        return this.repository.findCropById(id) as any
    }

    async createCrop(data: CreateCropInput): Promise<CropResponse> {
        return this.repository.createCrop(data) as any
    }

    async updateCrop(id: string, data: UpdateCropInput): Promise<CropResponse> {
        return this.repository.updateCrop(id, data) as any
    }

    async deleteCrop(id: string): Promise<void> {
        await this.repository.deleteCrop(id)
    }
}
