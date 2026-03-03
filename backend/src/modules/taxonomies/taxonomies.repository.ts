import type { PrismaClient } from '../../generated/prisma/client.js'

export class TaxonomiesRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; search?: string }) {
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

    async count(search?: string) {
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
}
