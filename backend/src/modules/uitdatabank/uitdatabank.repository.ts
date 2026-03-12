import type { PrismaClient } from '@prisma/client'

export class UitdatabankRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAllKeywords(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: { contains: search, mode: 'insensitive' as const },
        } : {}

        return this.prisma.uitdatabank_keyword.findMany({
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

        return this.prisma.uitdatabank_keyword.count({
            where,
        })
    }

    async findKeywordById(id: string) {
        return this.prisma.uitdatabank_keyword.findUnique({
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

        return this.prisma.uitdatabank_theme.findMany({
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

        return this.prisma.uitdatabank_theme.count({
            where,
        })
    }

    async findThemeById(id: string) {
        return this.prisma.uitdatabank_theme.findUnique({
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

        return this.prisma.uitdatabank_type.findMany({
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

        return this.prisma.uitdatabank_type.count({
            where,
        })
    }

    async findTypeById(id: string) {
        return this.prisma.uitdatabank_type.findUnique({
            where: { id },
            include: {
                production: true
            }
        })
    }
}
