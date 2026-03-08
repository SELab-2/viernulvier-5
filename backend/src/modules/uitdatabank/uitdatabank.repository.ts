import type { PrismaClient } from '../../generated/prisma/client.js'

export class UitdatabankRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAllKeywords(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: { contains: search, mode: 'insensitive' as const },
        } : {}

        return this.prisma.uitdatabank_keywords.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        })
    }

    async countKeywords(search?: string) {
        const where = search ? {
            name: { contains: search, mode: 'insensitive' as const },
        } : {}

        return this.prisma.uitdatabank_keywords.count({
            where,
        })
    }

    async findKeywordById(id: string) {
        return this.prisma.uitdatabank_keywords.findUnique({
            where: { id },
            include: {
                uit_keywords_productions: {
                    include: {
                        production: true
                    }
                }
            }
        })
    }

    async findAllThemes(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: { contains: search, mode: 'insensitive' as const },
        } : {}

        return this.prisma.uitdatabank_themes.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        })
    }

    async countThemes(search?: string) {
        const where = search ? {
            name: { contains: search, mode: 'insensitive' as const },
        } : {}

        return this.prisma.uitdatabank_themes.count({
            where,
        })
    }

    async findThemeById(id: string) {
        return this.prisma.uitdatabank_themes.findUnique({
            where: { id },
            include: {
                production: true
            }
        })
    }

    async findAllTypes(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: { contains: search, mode: 'insensitive' as const },
        } : {}

        return this.prisma.uitdatabank_types.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
        })
    }

    async countTypes(search?: string) {
        const where = search ? {
            name: { contains: search, mode: 'insensitive' as const },
        } : {}

        return this.prisma.uitdatabank_types.count({
            where,
        })
    }

    async findTypeById(id: string) {
        return this.prisma.uitdatabank_types.findUnique({
            where: { id },
            include: {
                production: true
            }
        })
    }
}
