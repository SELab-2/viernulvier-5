import type { PrismaClient } from '../../generated/prisma/client.js'

export class SpacesRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; search?: string; lang?: string }) {
        const { page, limit, search, lang = 'nl' } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: {
                path: [lang],
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

    async count(options: { search?: string; lang?: string }) {
        const { search, lang = 'nl' } = options
        const where = search ? {
            name: {
                path: [lang],
                string_contains: search,
            },
        } : {}

        return this.prisma.space.count({
            where: where as any,
        })
    }

    async findById(id: string) {
        return this.prisma.space.findUnique({
            where: { id },
            include: {
                halls: true,
                location: true
            }
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
