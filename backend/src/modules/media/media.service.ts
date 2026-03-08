import { MediaRepository } from './media.repository.js'
import type { 
    PaginationQuery, 
    GalleryResponse, 
    ItemResponse, 
    CropResponse 
} from './media.schema.js'

export class MediaService {
    constructor(private readonly repository: MediaRepository) { }

    async getGalleries(options: PaginationQuery) {
        const { page, limit, search } = options
        const [data, total] = await Promise.all([
            this.repository.findAllGalleries({ page, limit, search }),
            this.repository.countGalleries(search),
        ])
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
    }

    async getGallery(id: string): Promise<GalleryResponse | null> {
        return this.repository.findGalleryById(id) as any
    }

    async getItems(options: PaginationQuery) {
        const { page, limit, search } = options
        const [data, total] = await Promise.all([
            this.repository.findAllItems({ page, limit, search }),
            this.repository.countItems(search),
        ])
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
    }

    async getItem(id: string): Promise<ItemResponse | null> {
        return this.repository.findItemById(id) as any
    }

    async getCrops(options: PaginationQuery) {
        const { page, limit, search } = options
        const [data, total] = await Promise.all([
            this.repository.findAllCrops({ page, limit, search }),
            this.repository.countCrops(search),
        ])
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
    }

    async getCrop(id: string): Promise<CropResponse | null> {
        return this.repository.findCropById(id) as any
    }
}
