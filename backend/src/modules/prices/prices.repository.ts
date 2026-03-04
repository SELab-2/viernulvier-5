import type { PrismaClient } from '../../generated/prisma/client.js'

export class PricesRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { type: { contains: search, mode: 'insensitive' } },
                {
                    description: {
                        path: ['nl'],
                        string_contains: search,
                    },
                },
            ],
        } : {}

        return this.prisma.price.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async count(search?: string) {
        const where = search ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { type: { contains: search, mode: 'insensitive' } },
                {
                    description: {
                        path: ['nl'],
                        string_contains: search,
                    },
                },
            ],
        } : {}

        return this.prisma.price.count({
            where: where as any,
        })
    }

    async findAllRanks(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                {
                    description: {
                        path: ['nl'],
                        string_contains: search,
                    },
                },
            ],
        } : {}

        return this.prisma.rank.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countRanks(search?: string) {
        const where = search ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                {
                    description: {
                        path: ['nl'],
                        string_contains: search,
                    },
                },
            ],
        } : {}

        return this.prisma.rank.count({
            where: where as any,
        })
    }
}
