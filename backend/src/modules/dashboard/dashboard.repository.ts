import type { PrismaClient } from '@prisma/client'
import { Role } from '../../domain/role.js'
import type { BlogsRepository } from '../blogs/blogs.repository.js'

export type RawProduction = {
    id: string
    title: unknown
    updated_at: Date
}

export type RawEvent = {
    id: string
    info: unknown
    updated_at: Date
    production: { title: unknown } | null
}

export type DashboardCounts = {
    productions: number
    events: number
    blogs: number
    mediaItems: number
    editors: number
}

export class DashboardRepository {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly blogsRepository: BlogsRepository,
    ) {}

    async getCounts(): Promise<DashboardCounts> {
        const [productions, events, blogs, mediaItems, editors] = await Promise.all([
            this.prisma.production.count(),
            this.prisma.event.count(),
            this.blogsRepository.count({}),
            this.prisma.item.count(),
            this.prisma.adminUser.count({ where: { role: Role.EDITOR } }),
        ])

        return { productions, events, blogs, mediaItems, editors }
    }

    async getLastScraped(): Promise<Date | null> {
        const row = await this.prisma.last_scraped.findFirst({ orderBy: { time: 'desc' } })
        return row?.time ?? null
    }

    async getRecentProductions(limit: number): Promise<RawProduction[]> {
        return this.prisma.production.findMany({
            take: limit,
            orderBy: { updated_at: 'desc' },
            select: {
                id: true,
                title: true,
                updated_at: true,
            },
        })
    }

    async getRecentEvents(limit: number): Promise<RawEvent[]> {
        return this.prisma.event.findMany({
            take: limit,
            orderBy: { updated_at: 'desc' },
            select: {
                id: true,
                info: true,
                updated_at: true,
                production: {
                    select: {
                        title: true,
                    },
                },
            },
        })
    }

    async getProductionCountInRange(from: Date, to: Date): Promise<number> {
        return this.prisma.production.count({
            where: { created_at: { gte: from, lt: to } },
        })
    }

    async getBlogCountInRange(from: Date, to: Date): Promise<number> {
        return this.blogsRepository.countInRange({ from, to })
    }
}
