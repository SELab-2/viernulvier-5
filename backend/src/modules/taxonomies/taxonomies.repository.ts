import type { PrismaClient } from '../../generated/prisma/client.js'

export class TaxonomiesRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAllGenres(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.genre.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                type: true,
                name: true,
                slug: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    async countGenres(search?: string) {
        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.genre.count({
            where: where as any,
        })
    }

    async findGenreById(id: string) {
        return this.prisma.genre.findUnique({
            where: { id },
            include: {
                genre_production: {
                    include: {
                        production: true
                    }
                }
            }
        })
    }

    async createGenre(data: any) {
        return this.prisma.genre.create({
            data
        })
    }

    async updateGenre(id: string, data: any) {
        return this.prisma.genre.update({
            where: { id },
            data
        })
    }

    async deleteGenre(id: string) {
        return this.prisma.genre.delete({
            where: { id }
        })
    }

    /**
     * Get a paginated list of tags from the database.
     */
    async findAllTags(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.tag.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                code: true,
                name: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    /**
     * Count total number of tags for pagination metadata.
     */
    async countTags(search?: string) {
        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.tag.count({
            where: where as any,
        })
    }

    async findTagById(id: string) {
        return this.prisma.tag.findUnique({
            where: { id },
            include: {
                gallery: true
            }
        })
    }

    async createTag(data: any) {
        return this.prisma.tag.create({
            data
        })
    }

    async updateTag(id: string, data: any) {
        return this.prisma.tag.update({
            where: { id },
            data
        })
    }

    async deleteTag(id: string) {
        return this.prisma.tag.delete({
            where: { id }
        })
    }
}

