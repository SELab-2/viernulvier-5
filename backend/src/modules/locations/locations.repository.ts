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

    async findAllHalls(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.hall.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                name: true,
                space_id: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    async countHalls(search?: string) {
        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.hall.count({
            where: where as any,
        })
    }

    async findHallById(id: string) {
        return this.prisma.hall.findUnique({
            where: { id },
            include: {
                space: {
                    include: {
                        location: true
                    }
                }
            }
        })
    }

    async findAllSpaces(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.space.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                name: true,
                location_id: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    async countSpaces(search?: string) {
        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.space.count({
            where: where as any,
        })
    }

    async findSpaceById(id: string) {
        return this.prisma.space.findUnique({
            where: { id },
            include: {
                halls: true,
                location: true
            }
        })
    }
}
