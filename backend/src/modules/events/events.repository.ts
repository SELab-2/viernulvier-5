import type { PrismaClient } from '../../generated/prisma/client.js'

export class EventsRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findAll(options: { page: number; limit: number; productionId?: string; search?: string; lang?: string }) {
        const { page, limit, productionId, search, lang = 'nl' } = options
        const skip = (page - 1) * limit

        const where: any = {}
        if (productionId) where.production_id = productionId
        if (search) {
            where.info = {
                path: [lang],
                string_contains: search,
            }
        }

        return this.prisma.event.findMany({
            where: where,
            skip,
            take: limit,
            orderBy: { starts_at: 'desc' },
        })
    }

    async count(options: { productionId?: string; search?: string; lang?: string }) {
        const { productionId, search, lang = 'nl' } = options
        const where: any = {}
        if (productionId) where.production_id = productionId
        if (search) {
            where.info = {
                path: [lang],
                string_contains: search,
            }
        }

        return this.prisma.event.count({
            where: where,
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

    async findAllPrices(options: { page: number; limit: number; eventId?: string; search?: string }) {
        const { page, limit, eventId, search } = options
        const skip = (page - 1) * limit

        const where: any = search ? {
            OR: [
                { amount: { contains: search, mode: 'insensitive' } },
                { box_office_id: { contains: search, mode: 'insensitive' } },
            ],
        } : {}

        if (eventId) where.event_id = eventId

        return this.prisma.event_price.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countPrices(options: { eventId?: string; search?: string }) {
        const { eventId, search } = options
        const where: any = search ? {
            OR: [
                { amount: { contains: search, mode: 'insensitive' } },
                { box_office_id: { contains: search, mode: 'insensitive' } },
            ],
        } : {}

        if (eventId) where.event_id = eventId

        return this.prisma.event_price.count({
            where: where as any,
        })
    }

    async findPriceById(id: string) {
        return this.prisma.event_price.findUnique({
            where: { id },
            include: {
                event: true
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

    async delete(id: string) {
        return this.prisma.event.delete({
            where: { id }
        })
    }
}
