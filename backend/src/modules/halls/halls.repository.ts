import type { PrismaClient } from '@prisma/client'

export class HallsRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; spaceId?: string; search?: string; lang?: string }) {
        const { page, limit, spaceId, search, lang = 'nl' } = options
        const skip = (page - 1) * limit

        const where: any = {}
        if (spaceId) where.space_id = spaceId
        if (search) {
            where.name = {
                path: [lang],
                string_contains: search,
            }
        }

        return this.prisma.hall.findMany({
            where: where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async count(options: { spaceId?: string; search?: string; lang?: string }) {
        const { spaceId, search, lang = 'nl' } = options
        
        const where: any = {}
        if (spaceId) where.space_id = spaceId
        if (search) {
            where.name = {
                path: [lang],
                string_contains: search,
            }
        }

        return this.prisma.hall.count({
            where: where,
        })
    }

    async findById(id: string) {
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

    async create(data: any) {
        return this.prisma.hall.create({
            data
        })
    }

    async update(id: string, data: any) {
        return this.prisma.hall.update({
            where: { id },
            data
        })
    }

    async delete(id: string) {
        return this.prisma.hall.delete({
            where: { id }
        })
    }
}
