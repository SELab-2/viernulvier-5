import type { PrismaClient } from '../../generated/prisma/index.js'
import type { PaginationQuery } from './prices.schema.js'

export class PricesRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAllPrices(options: PaginationQuery) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        return this.prisma.price.findMany({
            where: search ? {
                OR: [
                    { type: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ]
            } : undefined,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countPrices(search?: string) {
        return this.prisma.price.count({
            where: search ? {
                OR: [
                    { type: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ]
            } : undefined,
        })
    }

    async findAllRanks(options: PaginationQuery) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        return this.prisma.rank.findMany({
            where: search ? {
                code: { contains: search, mode: 'insensitive' },
            } : undefined,
            skip,
            take: limit,
            orderBy: { position: 'asc' },
        })
    }

    async countRanks(search?: string) {
        return this.prisma.rank.count({
            where: search ? {
                code: { contains: search, mode: 'insensitive' },
            } : undefined,
        })
    }
}
