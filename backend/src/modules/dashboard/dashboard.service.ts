import type { DashboardRepository, RawBlog, RawPoster, RawProduction } from './dashboard.repository.js'

type DeltaDirection = 'up' | 'down' | 'flat'

type Delta = {
    changePct: number | null
    direction: DeltaDirection
}

type DashboardDeltas = {
    productions: Delta
    blogs: Delta
    posters: Delta
}

type DashboardLanguageStatus = {
    nl: 'complete' | 'attention'
    en: 'complete' | 'attention' | 'missing'
}

type DashboardRecentItem = {
    id: string
    title: string
    type: string
    status: 'available'
    languageStatus?: DashboardLanguageStatus
    updated_at: Date
}

type DashboardSummary = {
    counts: {
        productions: number
        posters: number
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

const RECENT_ITEMS_CAP = 30

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

function resolveLanguageStatus(value: unknown): DashboardLanguageStatus {
    const localized = asLocalizedRecord(value)
    const nl = hasValue(localized.nl) ? 'complete' : 'attention'
    const en = hasValue(localized.en) ? 'complete' : 'missing'

    return { nl, en }
}

function resolveLocalizedTitle(value: unknown, fallback: string): string {
    const localized = asLocalizedRecord(value)
    const title = localized.nl ?? localized.en

    return hasValue(title) ? String(title) : fallback
}

function mapProduction(production: RawProduction): DashboardRecentItem {
    return {
        id: production.id,
        title: resolveLocalizedTitle(production.title, 'Ongetitelde productie'),
        type: 'Productie',
        status: 'available',
        languageStatus: resolveLanguageStatus(production.title),
        updated_at: production.updated_at,
    }
}

function mapBlog(blog: RawBlog): DashboardRecentItem {
    return {
        id: blog.id,
        title: resolveLocalizedTitle(blog.title, 'Ongetitelde blog'),
        type: 'Blog',
        status: 'available',
        languageStatus: resolveLanguageStatus(blog.title),
        updated_at: blog.updated_at,
    }
}

function mapPoster(poster: RawPoster): DashboardRecentItem {
    return {
        id: poster.id,
        title: poster.title,
        type: 'Poster',
        status: 'available',
        updated_at: poster.updated_at,
    }
}

function mergeAndPaginate(
    productions: RawProduction[],
    blogs: RawBlog[],
    posters: RawPoster[],
    page: number,
    limit: number,
): DashboardRecentItem[] {
    const all = [
        ...productions.map(mapProduction),
        ...blogs.map(mapBlog),
        ...posters.map(mapPoster),
    ].sort((left, right) => right.updated_at.getTime() - left.updated_at.getTime())

    const offset = (page - 1) * limit
    return all.slice(offset, offset + limit)
}

export class DashboardService {
    constructor(private readonly repository: DashboardRepository) {}

    async getSummary({ page, limit }: GetSummaryOptions): Promise<DashboardSummary> {
        const now = new Date()
        const { startOfThisMonth, startOfLastMonth } = currentMonthBounds(now)

        const [
            counts,
            lastScrapedAt,
            recentProductions,
            recentBlogs,
            recentPosters,
            productionsThisMonth,
            productionsLastMonth,
            blogsThisMonth,
            blogsLastMonth,
            postersThisMonth,
            postersLastMonth,
        ] = await Promise.all([
            this.repository.getCounts(),
            this.repository.getLastScraped(),
            this.repository.getRecentProductions(RECENT_ITEMS_CAP),
            this.repository.getRecentBlogs(RECENT_ITEMS_CAP),
            this.repository.getRecentPosters(RECENT_ITEMS_CAP),
            this.repository.getProductionCountInRange(startOfThisMonth, now),
            this.repository.getProductionCountInRange(startOfLastMonth, startOfThisMonth),
            this.repository.getBlogCountInRange(startOfThisMonth, now),
            this.repository.getBlogCountInRange(startOfLastMonth, startOfThisMonth),
            this.repository.getPosterCountInRange(startOfThisMonth, now),
            this.repository.getPosterCountInRange(startOfLastMonth, startOfThisMonth),
        ])

        const recentItems = mergeAndPaginate(recentProductions, recentBlogs, recentPosters, page, limit)
        const totalRecentItems = recentItems.length === limit
            ? Math.min(counts.productions + counts.blogs + counts.posters, RECENT_ITEMS_CAP)
            : (page - 1) * limit + recentItems.length

        return {
            counts,
            recentItems,
            totalRecentItems,
            lastScrapedAt,
            deltas: {
                productions: computeDelta(productionsThisMonth, productionsLastMonth),
                blogs: computeDelta(blogsThisMonth, blogsLastMonth),
                posters: computeDelta(postersThisMonth, postersLastMonth),
            },
        }
    }
}