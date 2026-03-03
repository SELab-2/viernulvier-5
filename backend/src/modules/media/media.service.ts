import { MediaRepository } from './media.repository.js'
import type { PaginationQuery } from './media.schema.js'

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

    async getItems(options: PaginationQuery) {
        const { page, limit, search } = options
        const [data, total] = await Promise.all([
            this.repository.findAllItems({ page, limit, search }),
            this.repository.countItems(search),
        ])
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
    }

    async getCrops(options: PaginationQuery) {
        const { page, limit, search } = options
        const [data, total] = await Promise.all([
            this.repository.findAllCrops({ page, limit, search }),
            this.repository.countCrops(search),
        ])
        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
    }
}
