import type { PrismaClient } from '../../generated/prisma/client.js'

export class LocationsRepository {
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

        return this.prisma.location.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                name: true,
                city: true,
                street: true,
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

        return this.prisma.location.count({
            where: where as any,
        })
    }

    async findById(id: string) {
        return this.prisma.location.findUnique({
            where: { id },
            include: {
                space: {
                    include: {
                        halls: true
                    }
                }
            }
        })
    }

    async create(data: any) {
        return this.prisma.location.create({
            data
        })
    }

    async update(id: string, data: any) {
        return this.prisma.location.update({
            where: { id },
            data
        })
    }

    async delete(id: string) {
        return this.prisma.location.delete({
            where: { id }
        })
    }
}
