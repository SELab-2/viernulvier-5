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

    async findById(id: string) {
        return this.prisma.event.findUnique({
            where: { id },
            include: {
                event_prices: true,
                hall: true,
                production: true
            }
        })
    }

    async findAllPrices(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            OR: [
                { amount: { contains: search, mode: 'insensitive' } },
                { box_office_id: { contains: search, mode: 'insensitive' } },
            ],
        } : {}

        return this.prisma.event_price.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countPrices(search?: string) {
        const where = search ? {
            OR: [
                { amount: { contains: search, mode: 'insensitive' } },
                { box_office_id: { contains: search, mode: 'insensitive' } },
            ],
        } : {}

        return this.prisma.event_price.count({
            where: where as any,
        })
    }

    async findPriceById(id: string) {
        return this.prisma.event_price.findUnique({
            where: { id },
            include: {
                event: true,
                price: true,
                rank: true
            }
        })
    }

    async create(data: any) {
        return this.prisma.event.create({
            data,
        })
    }

    async update(id: string, data: any) {
        return this.prisma.event.update({
            where: { id },
            data,
        })
    }
}
