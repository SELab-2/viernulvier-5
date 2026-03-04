import type { PrismaClient } from '../../generated/prisma/client.js'

export class OrganisationsRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: {
                contains: search,
                mode: 'insensitive'
            },
        } : {}

        return this.prisma.organisations.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async count(search?: string) {
        const where = search ? {
            name: {
                contains: search,
                mode: 'insensitive'
            },
        } : {}

        return this.prisma.organisations.count({
            where: where as any,
        })
    }
}
