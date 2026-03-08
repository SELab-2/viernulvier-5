import type { PrismaClient } from '../../generated/prisma/client.js'

export class ProductionsRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            title: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.production.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                title: true,
                artist: true,
                description: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    async count(search?: string) {
        const where = search ? {
            title: {
                path: ['nl'],
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
                }
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
}
