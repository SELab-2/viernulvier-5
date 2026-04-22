import type { DashboardRepository, RawProduction, RawEvent } from './dashboard.repository.js'

type DeltaDirection = 'up' | 'down' | 'flat'

type Delta = {
    changePct: number | null
    direction: DeltaDirection
}

type DashboardDeltas = {
    productions: Delta
    blogs: Delta
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
    counts: {
        productions: number
        events: number
        blogs: number
        mediaItems: number
        editors: number
    }
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

function mapProduction(production: RawProduction): DashboardRecentItem {
    return {
        id: production.id,
        title: resolveProductionTitle(production.title),
        type: 'Productie',
        status: 'available',
        languageStatus: resolveLanguageStatus(production.title),
        updatedAt: production.updated_at,
    }
}

function mapEvent(event: RawEvent): DashboardRecentItem {
    return {
        id: event.id,
        title: resolveEventTitle(event.info, event.production?.title),
        type: 'Event',
        status: 'available',
        languageStatus: resolveLanguageStatus(event.info),
        updatedAt: event.updated_at,
    }
}

function mergeAndPaginate(
    productions: RawProduction[],
    events: RawEvent[],
    page: number,
    limit: number,
): DashboardRecentItem[] {
    const all = [
        ...productions.map(mapProduction),
        ...events.map(mapEvent),
    ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())

    const offset = (page - 1) * limit
    return all.slice(offset, offset + limit)
}

export class DashboardService {
    constructor(private readonly repository: DashboardRepository) {}

    async getSummary({ page, limit }: GetSummaryOptions): Promise<DashboardSummary> {
        const fetchCount = page * limit
        const now = new Date()
        const { startOfThisMonth, startOfLastMonth } = currentMonthBounds(now)

        const [
            counts,
            lastScrapedAt,
            recentProductions,
            recentEvents,
            productionsThisMonth,
            productionsLastMonth,
            blogsThisMonth,
            blogsLastMonth,
        ] = await Promise.all([
            this.repository.getCounts(),
            this.repository.getLastScraped(),
            this.repository.getRecentProductions(fetchCount),
            this.repository.getRecentEvents(fetchCount),
            this.repository.getProductionCountInRange(startOfThisMonth, now),
            this.repository.getProductionCountInRange(startOfLastMonth, startOfThisMonth),
            this.repository.getBlogCountInRange(startOfThisMonth, now),
            this.repository.getBlogCountInRange(startOfLastMonth, startOfThisMonth),
        ])

        const totalRecentItems = counts.productions + counts.events
        const recentItems = mergeAndPaginate(recentProductions, recentEvents, page, limit)

        return {
            counts,
            recentItems,
            totalRecentItems,
            lastScrapedAt,
            deltas: {
                productions: computeDelta(productionsThisMonth, productionsLastMonth),
                blogs: computeDelta(blogsThisMonth, blogsLastMonth),
            },
        }
    }
}
