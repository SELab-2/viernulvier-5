import type { PrismaClient } from '../../generated/prisma/client.js'

export class MediaRepository {
    constructor(private readonly prisma: PrismaClient) { }

    // Galleries
    async findAllGalleries(options: { page: number; limit: number; search?: string; lang?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit
        const where = search ? { name: { contains: search } } : {}

        return this.prisma.gallery.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countGalleries(options: { search?: string; lang?: string }) {
        const { search } = options
        const where = search ? { name: { contains: search } } : {}
        return this.prisma.gallery.count({ where: where as any })
    }

    async findGalleryById(id: string) {
        return this.prisma.gallery.findUnique({
            where: { id },
            include: {
                items: true,
                tags: true,
                media_gallery_productions: true,
                poster_gallery_productions: true,
                review_gallery_productions: true
            }
        })
    }

    async createGallery(data: any) {
        return this.prisma.gallery.create({
            data
        })
    }

    async updateGallery(id: string, data: any) {
        return this.prisma.gallery.update({
            where: { id },
            data
        })
    }

    async deleteGallery(id: string) {
        return this.prisma.gallery.delete({
            where: { id }
        })
    }

    // Items
    async findAllItems(options: { page: number; limit: number; search?: string; lang?: string }) {
        const { page, limit, search, lang = 'nl' } = options
        const skip = (page - 1) * limit
        const where = search ? {
            title: {
                path: [lang],
                string_contains: search,
            },
        } : {}

        return this.prisma.item.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countItems(options: { search?: string; lang?: string }) {
        const { search, lang = 'nl' } = options
        const where = search ? {
            title: {
                path: [lang],
                string_contains: search,
            },
        } : {}
        return this.prisma.item.count({ where: where as any })
    }

    async findItemById(id: string) {
        return this.prisma.item.findUnique({
            where: { id },
            include: {
                gallery: true,
                crop: true
            }
        })
    }

    async createItem(data: any) {
        return this.prisma.item.create({
            data
        })
    }

    async updateItem(id: string, data: any) {
        return this.prisma.item.update({
            where: { id },
            data
        })
    }

    async deleteItem(id: string) {
        return this.prisma.item.delete({
            where: { id }
        })
    }

    // Crops
    async findAllCrops(options: { page: number; limit: number; search?: string; lang?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit
        const where = search ? { name: { contains: search } } : {}

        return this.prisma.crop.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countCrops(options: { search?: string; lang?: string }) {
        const { search } = options
        const where = search ? { name: { contains: search } } : {}
        return this.prisma.crop.count({ where: where as any })
    }

    async findCropById(id: string) {
        return this.prisma.crop.findUnique({
            where: { id },
            include: {
                item: true
            }
        })
    }

    async createCrop(data: any) {
        return this.prisma.crop.create({
            data
        })
    }

    async updateCrop(id: string, data: any) {
        return this.prisma.crop.update({
            where: { id },
            data
        })
    }

    async deleteCrop(id: string) {
        return this.prisma.crop.delete({
            where: { id }
        })
    }
}
