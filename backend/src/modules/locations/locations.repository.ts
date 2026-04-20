import type { PrismaClient } from '@prisma/client'

export class LocationsRepository {
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

        return this.prisma.location.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async count(options: { search?: string; lang?: string }) {
        const { search, lang = 'nl' } = options
        
        if (!search) {
            return this.prisma.location.count({})
        }

        return this.prisma.location.count({
            where: {
                name: {
                    path: [lang],
                    string_contains: search,
                },
            } as any,
        })
    }

    async findById(id: string) {
        return this.prisma.location.findUnique({
            where: { id }
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
