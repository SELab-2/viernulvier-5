import type { PrismaClient } from '../../generated/prisma/client.js'

export class EventsRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; productionId?: string }) {
        const { page, limit, productionId } = options
        const skip = (page - 1) * limit

        const where = productionId ? { production_id: productionId } : {}

        return this.prisma.event.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { starts_at: 'desc' },
            select: {
                id: true,
                starts_at: true,
                ends_at: true,
                doors_at: true,
                production_id: true,
                info: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    async count(productionId?: string) {
        const where = productionId ? { production_id: productionId } : {}

        return this.prisma.event.count({
            where: where as any,
        })
    }
}
