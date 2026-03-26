import type { PrismaClient } from '@prisma/client'

export class ProductionsRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; search?: string; lang?: string }) {
        const { page, limit, search, lang = 'nl' } = options
        const skip = (page - 1) * limit

        const where = search ? {
            title: {
                path: [lang],
                string_contains: search,
            },
        } : {}

        return this.prisma.production.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                poster_gallery: {
                    include: {
                        items: {
                            take: 1,
                            orderBy: { created_at: 'asc' },
                        },
                    },
                },
                media_gallery: {
                    include: {
                        items: {
                            take: 1,
                            orderBy: { created_at: 'asc' },
                        },
                    },
                },
            },
        })
    }

    async count(options: { search?: string; lang?: string }) {
        const { search, lang = 'nl' } = options
        const where = search ? {
            title: {
                path: [lang],
                string_contains: search,
            },
        } : {}

        return this.prisma.production.count({
            where: where as any,
        })
    }

    async findById(id: string) {
        return this.prisma.production.findUnique({
            where: { id },
            include: {
                events: true,
                genre_production: {
                    include: {
                        genre: true
                    }
                },
                poster_gallery: {
                    include: {
                        items: true,
                    },
                },
                media_gallery: {
                    include: {
                        items: true,
                    },
                },
            }
        })
    }

    async create(data: any) {
        return this.prisma.production.create({
            data,
        })
    }

    async update(id: string, data: any) {
        return this.prisma.production.update({
            where: { id },
            data,
        })
    }

    async delete(id: string) {
        return this.prisma.production.delete({
            where: { id }
        })
    }
}
