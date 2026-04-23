import type { PrismaClient } from '@prisma/client'

export class SpacesRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; locationId?: string; search?: string; lang?: string }) {
        const { page, limit, locationId, search, lang = 'nl' } = options
        const skip = (page - 1) * limit

        const where: any = {}

        if (locationId) {
            where.location_id = locationId
        }

        if (search) {
            where.name = {
                path: [lang],
                string_contains: search,
            }
        }

        return this.prisma.space.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async count(options: { locationId?: string; search?: string; lang?: string }) {
        const { locationId, search, lang = 'nl' } = options
        
        const where: any = {}

        if (locationId) {
            where.location_id = locationId
        }

        if (search) {
            where.name = {
                path: [lang],
                string_contains: search,
            }
        }

        return this.prisma.space.count({
            where,
        })
    }

    async findById(id: string) {
        return this.prisma.space.findUnique({
            where: { id },
        })
    }

    async create(data: any) {
        return this.prisma.space.create({
            data
        })
    }

    async update(id: string, data: any) {
        return this.prisma.space.update({
            where: { id },
            data
        })
    }

    async delete(id: string) {
        return this.prisma.space.delete({
            where: { id }
        })
    }
}
