import type { PrismaClient } from '../../generated/prisma/client.js'

export class MediaRepository {
    constructor(private readonly prisma: PrismaClient) { }

    // Galleries
    async findAllGalleries(options: { page: number; limit: number; search?: string }) {
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

    async countGalleries(search?: string) {
        const where = search ? { name: { contains: search } } : {}
        return this.prisma.gallery.count({ where: where as any })
    }

    // Items
    async findAllItems(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit
        const where = search ? {
            title: {
                path: ['nl'],
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

    async countItems(search?: string) {
        const where = search ? {
            title: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}
        return this.prisma.item.count({ where: where as any })
    }

    // Crops
    async findAllCrops(options: { page: number; limit: number; search?: string }) {
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

    async countCrops(search?: string) {
        const where = search ? { name: { contains: search } } : {}
        return this.prisma.crop.count({ where: where as any })
    }
}
