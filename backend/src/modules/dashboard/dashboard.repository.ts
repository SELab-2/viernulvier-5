import type { PrismaClient } from '@prisma/client'
import { Role } from '../../domain/role.js'

type DashboardCount = {
    productions: number
    events: number
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
    lastScrapedAt: Date | null
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
    constructor(private readonly prisma: PrismaClient) {}

    async getSummary(): Promise<DashboardSummary> {
        const [
            productions,
            events,
            mediaItems,
            editors,
            lastScraped,
            recentProductions,
            recentEvents,
        ] = await Promise.all([
            this.prisma.production.count(),
            this.prisma.event.count(),
            this.prisma.item.count(),
            this.prisma.adminUser.count({ where: { role: Role.EDITOR } }),
            this.prisma.last_scraped.findFirst({ orderBy: { time: 'desc' } }),
            this.prisma.production.findMany({
                take: 3,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    title: true,
                    created_at: true,
                },
            }),
            this.prisma.event.findMany({
                take: 3,
                orderBy: { starts_at: 'desc' },
                select: {
                    id: true,
                    info: true,
                    starts_at: true,
                    production: {
                        select: {
                            title: true,
                        },
                    },
                },
            }),
        ])

        const recentItems = [
            ...recentProductions.map<DashboardRecentItem>((production) => ({
                id: production.id,
                title: resolveProductionTitle(production.title),
                type: 'Productie',
                status: 'available',
                languageStatus: resolveLanguageStatus(production.title),
                updatedAt: production.created_at,
            })),
            ...recentEvents.map<DashboardRecentItem>((event) => ({
                id: event.id,
                title: resolveEventTitle(event.info, event.production?.title),
                type: 'Event',
                status: 'available',
                languageStatus: resolveLanguageStatus(event.info),
                updatedAt: event.starts_at ?? new Date(0),
            })),
        ]
            // We currently lack audited edit timestamps, so this is a recency feed based on the
            // freshest archive records we can source safely today.
            .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
            .slice(0, 3)

        return {
            counts: {
                productions,
                events,
                mediaItems,
                editors,
            },
            recentItems,
            lastScrapedAt: lastScraped?.time ?? null,
        }
    }
}
