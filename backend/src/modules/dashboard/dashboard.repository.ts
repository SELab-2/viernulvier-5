import type { PrismaClient } from '@prisma/client'
import { Role } from '../../domain/role.js'
import type { BlogsRepository } from '../blogs/blogs.repository.js'

type DeltaDirection = 'up' | 'down' | 'flat'

type Delta = {
    changePct: number | null
    direction: DeltaDirection
}

type DashboardDeltas = {
    productions: Delta
    blogs: Delta
}

type DashboardCount = {
    productions: number
    events: number
    blogs: number
    mediaItems: number
    editors: number
}

type DashboardRecentItem = {
    id: string
    title: string
    type: string
    status: 'available'
    languageStatus: {
        nl: 'complete' | 'attention'
        en: 'complete' | 'attention' | 'missing'
    }
    updatedAt: Date
}

type DashboardSummary = {
    counts: DashboardCount
    recentItems: DashboardRecentItem[]
    totalRecentItems: number
    lastScrapedAt: Date | null
    deltas: DashboardDeltas
}

type GetSummaryOptions = {
    page: number
    limit: number
}

function computeDelta(thisMonth: number, lastMonth: number): Delta {
    if (lastMonth === 0 && thisMonth === 0) {
        return { changePct: null, direction: 'flat' }
    }

    if (lastMonth === 0) {
        return { changePct: 100, direction: 'up' }
    }

    const changePct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
    const direction: DeltaDirection = changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat'

    return { changePct, direction }
}

function startOfMonth(year: number, month: number): Date {
    return new Date(Date.UTC(year, month, 1))
}

function currentMonthBounds(now: Date): { startOfThisMonth: Date; startOfLastMonth: Date } {
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth()
    const startOfThisMonth = startOfMonth(year, month)
    const startOfLastMonth = month === 0 ? startOfMonth(year - 1, 11) : startOfMonth(year, month - 1)

    return { startOfThisMonth, startOfLastMonth }
}

function asLocalizedRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {}
    }

    return value as Record<string, unknown>
}

function hasValue(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0
}

function resolveLanguageStatus(value: unknown): DashboardRecentItem['languageStatus'] {
    const localized = asLocalizedRecord(value)
    const nl = hasValue(localized.nl) ? 'complete' : 'attention'
    const en = hasValue(localized.en) ? 'complete' : 'missing'

    return { nl, en }
}

function resolveProductionTitle(value: unknown): string {
    const localized = asLocalizedRecord(value)
    const title = localized.nl ?? localized.en

    return hasValue(title) ? String(title) : 'Ongetitelde productie'
}

function resolveEventTitle(info: unknown, productionTitle: unknown): string {
    const localizedInfo = asLocalizedRecord(info)
    const infoTitle = localizedInfo.nl ?? localizedInfo.en
    if (hasValue(infoTitle)) {
        return String(infoTitle)
    }

    return resolveProductionTitle(productionTitle)
}

export class DashboardRepository {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly blogsRepository: BlogsRepository,
    ) {}

    async getSummary({ page, limit }: GetSummaryOptions): Promise<DashboardSummary> {
        const fetchCount = page * limit
        const now = new Date()
        const { startOfThisMonth, startOfLastMonth } = currentMonthBounds(now)

        const [
            productions,
            events,
            blogs,
            mediaItems,
            editors,
            lastScraped,
            recentProductions,
            recentEvents,
            productionsThisMonth,
            productionsLastMonth,
            blogsThisMonth,
            blogsLastMonth,
        ] = await Promise.all([
            this.prisma.production.count(),
            this.prisma.event.count(),
            this.blogsRepository.count({}),
            this.prisma.item.count(),
            this.prisma.adminUser.count({ where: { role: Role.EDITOR } }),
            this.prisma.last_scraped.findFirst({ orderBy: { time: 'desc' } }),
            this.prisma.production.findMany({
                take: fetchCount,
                orderBy: { updated_at: 'desc' },
                select: {
                    id: true,
                    title: true,
                    updated_at: true,
                },
            }),
            this.prisma.event.findMany({
                take: fetchCount,
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
            }),
            this.prisma.production.count({
                where: { created_at: { gte: startOfThisMonth, lt: now } },
            }),
            this.prisma.production.count({
                where: { created_at: { gte: startOfLastMonth, lt: startOfThisMonth } },
            }),
            this.blogsRepository.countInRange({ from: startOfThisMonth, to: now }),
            this.blogsRepository.countInRange({ from: startOfLastMonth, to: startOfThisMonth }),
        ])

        const totalRecentItems = productions + events

        const allRecentItems = [
            ...recentProductions.map<DashboardRecentItem>((production) => ({
                id: production.id,
                title: resolveProductionTitle(production.title),
                type: 'Productie',
                status: 'available',
                languageStatus: resolveLanguageStatus(production.title),
                updatedAt: production.updated_at,
            })),
            ...recentEvents.map<DashboardRecentItem>((event) => ({
                id: event.id,
                title: resolveEventTitle(event.info, event.production?.title),
                type: 'Event',
                status: 'available',
                languageStatus: resolveLanguageStatus(event.info),
                updatedAt: event.updated_at,
            })),
        ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())

        const offset = (page - 1) * limit
        const recentItems = allRecentItems.slice(offset, offset + limit)

        return {
            counts: {
                productions,
                events,
                blogs,
                mediaItems,
                editors,
            },
            recentItems,
            totalRecentItems,
            lastScrapedAt: lastScraped?.time ?? null,
            deltas: {
                productions: computeDelta(productionsThisMonth, productionsLastMonth),
                blogs: computeDelta(blogsThisMonth, blogsLastMonth),
            },
        }
    }
}
