import type { PrismaClient } from '@prisma/client'

export class TaxonomiesRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAllGenres(options: { page: number; limit: number; search?: string; lang?: string, productionId?: string }) {
        const { page, limit, search, lang = 'nl', productionId} = options
        const skip = (page - 1) * limit

        const where: any = {};
        if (search) {
            where.name = {
                path: [lang],
                string_contains: search,
                mode: 'insensitive',
            };
        }

        if (productionId) {
            where.genre_production = {
                some: {
                    production_id: productionId,
                },
            };
        }

        return this.prisma.genre.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countGenres(options: { search?: string; lang?: string, productionId?: string }) {
        const { search, lang = 'nl', productionId} = options
        const where: any = {};
        if (search) {
            where.name = {
                path: [lang],
                string_contains: search,
                mode: 'insensitive',
            };
        }

        if (productionId) {
            where.genre_production = {
                some: {
                    production_id: productionId,
                },
            };
        }

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
    async findAllTags(options: { page: number; limit: number; search?: string; lang?: string, productionId?: string }) {
        const { page, limit, search, lang = 'nl', productionId } = options
        const skip = (page - 1) * limit

        const where: any = {};
        if (search) {
            where.name = {
                path: [lang],
                string_contains: search,
                mode: 'insensitive',
            };
        }

        console.log("Filtering for production:", productionId);

        if (productionId) {
            console.log("Filtering for production:", productionId);
            where.tag_production = {
                some: {
                    production_id: productionId,
                },
            };
        }

        return this.prisma.tag.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    /**
     * Count total number of tags for pagination metadata.
     */
    async countTags(options: { search?: string; lang?: string, productionId?: string}) {
        const { search, lang = 'nl', productionId } = options
        const where: any = {};
        if (search) {
            where.name = {
                path: [lang],
                string_contains: search,
                mode: 'insensitive',
            };
        }

        if (productionId) {
            where.tag_production = {
                some: {
                    production_id: productionId,
                },
            };
        }

        return this.prisma.tag.count({
            where: where as any,
        })
    }

    async findTagById(id: string) {
        return this.prisma.tag.findUnique({
            where: { id },
            include: {
                tag_production: {
                    include: {
                        production: true
                    }
                }
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

