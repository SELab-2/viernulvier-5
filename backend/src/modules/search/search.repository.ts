import { Prisma, type PrismaClient } from '@prisma/client'
import type { BlogResponse } from '../blogs/blogs.schema.js'
import type { LocalizedBlogTitle } from '../blogs/blogs.schema.js'
import type { SearchQuery, SearchResultItem } from './search.schema.js'

type BlogSearchOptions = {
    search?: string
    yearFrom?: number
    yearTo?: number
    sort?: 'relevance' | 'recent' | 'oldest'
}

const GENRE_SEARCH_ALIASES: Record<string, string[]> = {
    theater: ['theater', 'theatre'],
    theatre: ['theatre', 'theater'],
    dans: ['dans', 'dance'],
    dance: ['dance', 'dans'],
    concert: ['concert'],
    nightlife: ['nightlife'],
    talks: ['talks', 'talk'],
    comedy: ['comedy', 'komedie'],
    komedie: ['komedie', 'comedy'],
    monument: ['monument'],
    circus: ['circus'],
    performance: ['performance', 'voorstelling'],
    voorstelling: ['voorstelling', 'performance'],
    'spoken word': ['spoken word'],
    'listening session': ['listening session'],
}

export class SearchRepository {
    private pgTrgmAvailable: boolean | null = null

    constructor(private readonly prisma: PrismaClient) {}

    private async ensurePgTrgmAvailable(): Promise<boolean> {
        if (this.pgTrgmAvailable !== null) {
            return this.pgTrgmAvailable
        }

        try {
            await this.prisma.$queryRaw(Prisma.sql`SELECT similarity('pen', 'penn')`)
            this.pgTrgmAvailable = true
            return true
        } catch {
            try {
                await this.prisma.$executeRaw(Prisma.sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`)
                await this.prisma.$queryRaw(Prisma.sql`SELECT similarity('pen', 'penn')`)
                this.pgTrgmAvailable = true
                return true
            } catch {
                this.pgTrgmAvailable = false
                return false
            }
        }
    }

    async searchAll(options: SearchQuery): Promise<{ items: SearchResultItem[]; total: number }> {
        const { page, limit, search, yearFrom, yearTo, genres, locations, sort, lang = 'nl', tab = 'all' } = options
        const offset = (page - 1) * limit
        const usePgTrgm = await this.ensurePgTrgmAvailable()
        const normalizedSearch = search?.trim().toLowerCase() || ''
        
        const genreList = genres ? genres.split(',').map(g => g.trim().toLowerCase()).filter(Boolean) : []
        const locationList = locations ? locations.split(',').map(l => l.trim().toLowerCase()).filter(Boolean) : []
        const expandedGenres = genreList.flatMap(g => GENRE_SEARCH_ALIASES[g] ?? [g])
        const localizedLang = lang === 'en' || lang === 'fr' ? lang : 'nl'

        const includeProductions = tab === 'all' || tab === 'productions'
        const includeBlogs = tab === 'all' || tab === 'blogs'

        // 1. Define the filtering logic for productions
        const productionFilter = includeProductions ? Prisma.sql`
            FROM "production" p
            WHERE 
                p.draft IS FALSE AND
                EXISTS (SELECT 1 FROM "event" e WHERE e.production_id = p.id AND e.starts_at < NOW())
                ${normalizedSearch ? Prisma.sql` AND (
                    LOWER(p.title ->> 'nl') ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(p.title ->> 'en') ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(p.description_short ->> 'nl') ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(p.description_short ->> 'en') ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%')
                    ${usePgTrgm ? Prisma.sql` OR
                        similarity(COALESCE(p.title ->> 'nl', ''), CAST(${normalizedSearch} AS text)) >= 0.2 OR
                        similarity(COALESCE(p.title ->> 'en', ''), CAST(${normalizedSearch} AS text)) >= 0.2
                    ` : Prisma.empty}
                )` : Prisma.empty}
                ${yearFrom ? Prisma.sql` AND EXISTS (SELECT 1 FROM "event" e WHERE e.production_id = p.id AND e.starts_at < NOW() AND EXTRACT(YEAR FROM e.starts_at) >= ${yearFrom})` : Prisma.empty}
                ${yearTo ? Prisma.sql` AND EXISTS (SELECT 1 FROM "event" e WHERE e.production_id = p.id AND e.starts_at < NOW() AND EXTRACT(YEAR FROM e.starts_at) <= ${yearTo})` : Prisma.empty}
                ${expandedGenres.length > 0 ? Prisma.sql` AND (
                    EXISTS (
                        SELECT 1 FROM "genre_production" gp 
                        JOIN "genre" g ON g.id = gp.genre_id 
                        WHERE gp.production_id = p.id AND (
                            ${Prisma.join(expandedGenres.map(g => Prisma.sql`LOWER(g.name ->> 'nl') ILIKE ${'%' + g + '%'}`), ' OR ')} OR
                            ${Prisma.join(expandedGenres.map(g => Prisma.sql`LOWER(g.name ->> 'en') ILIKE ${'%' + g + '%'}`), ' OR ')}
                        )
                    ) OR
                    EXISTS (
                        SELECT 1 FROM "tag_production" tp 
                        JOIN "tag" t ON t.id = tp.tag_id 
                        WHERE tp.production_id = p.id AND (
                            ${Prisma.join(expandedGenres.map(g => Prisma.sql`LOWER(t.name ->> 'nl') ILIKE ${'%' + g + '%'}`), ' OR ')} OR
                            ${Prisma.join(expandedGenres.map(g => Prisma.sql`LOWER(t.name ->> 'en') ILIKE ${'%' + g + '%'}`), ' OR ')}
                        )
                    )
                )` : Prisma.empty}
                ${locationList.length > 0 ? Prisma.sql` AND (
                    p.attendance_mode IN (${Prisma.join(locationList)}) OR
                    EXISTS (
                        SELECT 1 FROM "event" e 
                        JOIN "hall" h ON h.id = e.hall_id 
                        WHERE e.production_id = p.id AND (
                            ${Prisma.join(locationList.map(l => Prisma.sql`LOWER(h.name ->> 'nl') ILIKE ${'%' + l + '%'}`), ' OR ')} OR
                            ${Prisma.join(locationList.map(l => Prisma.sql`LOWER(h.name ->> 'en') ILIKE ${'%' + l + '%'}`), ' OR ')}
                        )
                    )
                )` : Prisma.empty}
        ` : Prisma.empty

        // 2. Define the filtering logic for blogs
        const blogFilter = includeBlogs ? Prisma.sql`
            FROM "blog" b
            WHERE 
                b.draft IS NOT TRUE
                ${normalizedSearch ? Prisma.sql` AND (
                    LOWER(b.title ->> 'nl') ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(b.title ->> 'en') ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(b.content ->> 'nl') ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(b.content ->> 'en') ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%')
                )` : Prisma.empty}
                ${yearFrom ? Prisma.sql` AND EXTRACT(YEAR FROM b.created_at) >= ${yearFrom}` : Prisma.empty}
                ${yearTo ? Prisma.sql` AND EXTRACT(YEAR FROM b.created_at) <= ${yearTo}` : Prisma.empty}
        ` : Prisma.empty

        // 3. Count total matching records (minimal query)
        const countQuery = Prisma.sql`
            SELECT (
                ${includeProductions ? Prisma.sql`(SELECT COUNT(*) ${productionFilter})` : Prisma.sql`0`} +
                ${includeBlogs ? Prisma.sql`(SELECT COUNT(*) ${blogFilter})` : Prisma.sql`0`}
            ) as total
        `

        // 4. Identify the Top-K (paginated) IDs
        const topIdsQuery = Prisma.sql`
            WITH matches AS (
                ${includeProductions ? Prisma.sql`
                (SELECT p.id, 'production' as type, 
                    (SELECT MAX(e.starts_at) FROM "event" e WHERE e.production_id = p.id AND e.starts_at < NOW()) as sort_date,
                    ${usePgTrgm && normalizedSearch ? Prisma.sql`
                        (CASE
                            WHEN LOWER(p.title ->> CAST(${localizedLang} AS text)) = CAST(${normalizedSearch} AS text) THEN 1000
                            WHEN LOWER(p.title ->> CAST(${localizedLang} AS text)) ILIKE CONCAT(CAST(${normalizedSearch} AS text), '%') THEN 900
                            WHEN LOWER(p.title ->> CAST(${localizedLang} AS text)) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 800
                            ELSE 0
                        END
                        + (similarity(COALESCE(p.title ->> CAST(${localizedLang} AS text), ''), CAST(${normalizedSearch} AS text)) * 220)
                        + (word_similarity(COALESCE(p.title ->> CAST(${localizedLang} AS text), ''), CAST(${normalizedSearch} AS text)) * 200))` : Prisma.sql`0`} as rank
                 ${productionFilter})
                ` : Prisma.empty}
                
                ${includeProductions && includeBlogs ? Prisma.sql` UNION ALL ` : Prisma.empty}

                ${includeBlogs ? Prisma.sql`
                (SELECT b.id, 'blog' as type, b.created_at as sort_date,
                    ${usePgTrgm && normalizedSearch ? Prisma.sql`
                        (CASE
                            WHEN LOWER(b.title ->> CAST(${localizedLang} AS text)) = CAST(${normalizedSearch} AS text) THEN 1000
                            WHEN LOWER(b.title ->> CAST(${localizedLang} AS text)) ILIKE CONCAT(CAST(${normalizedSearch} AS text), '%') THEN 900
                            WHEN LOWER(b.title ->> CAST(${localizedLang} AS text)) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 800
                            ELSE 0
                        END
                        + (similarity(COALESCE(b.title ->> CAST(${localizedLang} AS text), ''), CAST(${normalizedSearch} AS text)) * 220)
                        + (word_similarity(COALESCE(b.title ->> CAST(${localizedLang} AS text), ''), CAST(${normalizedSearch} AS text)) * 200))` : Prisma.sql`0`} as rank
                 ${blogFilter})
                ` : Prisma.empty}
            )
            SELECT id, type FROM matches
            ORDER BY 
                ${sort === 'relevance' ? Prisma.sql`rank DESC, sort_date DESC` : sort === 'oldest' ? Prisma.sql`sort_date ASC` : Prisma.sql`sort_date DESC`}
            LIMIT ${limit} OFFSET ${offset}
        `

        const [totalResult, topIds] = await Promise.all([
            this.prisma.$queryRaw<Array<{ total: bigint }>>(countQuery),
            this.prisma.$queryRaw<Array<{ id: string; type: string }>>(topIdsQuery),
        ])

        const total = Number(totalResult[0]?.total ?? 0)
        if (topIds.length === 0) return { items: [], total }

        // 5. Fetch rich data ONLY for the resulting Top-K IDs
        const productionIds = topIds.filter(t => t.type === 'production').map(t => t.id)
        const blogIds = topIds.filter(t => t.type === 'blog').map(t => t.id)

        const richItemsQuery = Prisma.sql`
            SELECT 
                id, type, title_json, excerpt, image_url, date_label, venue_label, genre_label, created_at
            FROM (
                ${productionIds.length > 0 ? Prisma.sql`
                    SELECT 
                        p.id,
                        'production' as type,
                        p.title as title_json,
                        COALESCE(p.description_short ->> CAST(${localizedLang} AS text), p.description_short ->> 'nl', p.teaser ->> CAST(${localizedLang} AS text), p.teaser ->> 'nl', '') as excerpt,
                        (
                            SELECT '/api/v1/images/' || c.id
                            FROM "crop" c
                            JOIN "item" i ON i.id = c.item_id
                            JOIN "gallery" g ON g.id = i.gallery_id
                            WHERE g.id = p.media_gallery_id
                            ORDER BY CASE WHEN c.name = 'FE3_header' THEN 1 WHEN c.name = 'FE3_boxed' THEN 2 ELSE 3 END, i.position ASC, c.created_at DESC
                            LIMIT 1
                        ) as image_url,
                        (
                            SELECT 
                                CASE 
                                    WHEN COUNT(e.id) = 1 THEN TO_CHAR(MIN(e.starts_at), 'DD/MM/YYYY')
                                    WHEN COUNT(DISTINCT EXTRACT(YEAR FROM e.starts_at)) = 1 THEN TO_CHAR(MIN(e.starts_at), 'DD/MM/YYYY') || ' - ' || TO_CHAR(MAX(e.starts_at), 'DD/MM/YYYY')
                                    ELSE CAST(EXTRACT(YEAR FROM MIN(e.starts_at)) AS TEXT) || ' - ' || CAST(EXTRACT(YEAR FROM MAX(e.starts_at)) AS TEXT)
                                END
                            FROM "event" e
                            WHERE e.production_id = p.id AND e.starts_at < NOW()
                        ) as date_label,
                        (
                            SELECT STRING_AGG(DISTINCT COALESCE(h.name ->> CAST(${localizedLang} AS text), h.name ->> 'nl', ''), ' • ')
                            FROM "event" e
                            JOIN "hall" h ON h.id = e.hall_id
                            WHERE e.production_id = p.id AND e.starts_at < NOW()
                        ) as venue_label,
                        (
                            SELECT COALESCE(g.name ->> CAST(${localizedLang} AS text), g.name ->> 'nl', '')
                            FROM "genre_production" gp
                            JOIN "genre" g ON g.id = gp.genre_id
                            WHERE gp.production_id = p.id
                            LIMIT 1
                        ) as genre_label,
                        p.created_at
                    FROM "production" p
                    WHERE p.id IN (${Prisma.join(productionIds)})
                ` : Prisma.empty}

                ${productionIds.length > 0 && blogIds.length > 0 ? Prisma.sql` UNION ALL ` : Prisma.empty}

                ${blogIds.length > 0 ? Prisma.sql`
                    SELECT 
                        b.id,
                        'blog' as type,
                        b.title as title_json,
                        COALESCE(b.content ->> CAST(${localizedLang} AS text), b.content ->> 'nl', '') as excerpt,
                        CASE
                            WHEN b.thumbnail_index IS NOT NULL
                                AND b.images IS NOT NULL
                                AND b.thumbnail_index >= 0
                                AND b.thumbnail_index < COALESCE(array_length(b.images, 1), 0)
                                THEN b.images[b.thumbnail_index + 1]
                            WHEN b.images IS NOT NULL
                                AND COALESCE(array_length(b.images, 1), 0) > 0
                                THEN b.images[1]
                            ELSE NULL
                        END as image_url,
                        TO_CHAR(b.created_at, 'DD/MM/YYYY') as date_label,
                        '' as venue_label,
                        'Blog' as genre_label,
                        b.created_at
                    FROM "blog" b
                    WHERE b.id IN (${Prisma.join(blogIds)})
                ` : Prisma.empty}
            ) rich_results
        `

        const richItems = await this.prisma.$queryRaw<any[]>(richItemsQuery)

        // 6. Restore the original Top-K order (sorting in memory for the final 12-48 items is negligible)
        const itemsMap = new Map(richItems.map(item => [item.id, item]))
        const mappedItems: SearchResultItem[] = topIds.map(top => {
            const item = itemsMap.get(top.id)
            if (!item) return null
            return {
                id: item.id,
                type: item.type as 'production' | 'blog',
                title: item.title_json,
                excerpt: this.stripHtml(item.excerpt).substring(0, 200),
                image_url: item.image_url,
                date_label: item.date_label,
                venue_label: item.venue_label,
                genre_label: item.genre_label,
                created_at: item.created_at.toISOString(),
            } as SearchResultItem
        }).filter((i): i is SearchResultItem => i !== null)

        return { items: mappedItems, total }
    }


    public stripHtml(html: unknown): string {
        if (html == null) {
            return ''
        }

        if (typeof html !== 'string') {
            return String(html)
        }

        return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim()
    }

    private normalizeBlogTitle(title: unknown): LocalizedBlogTitle | string | null {
        if (title == null) {
            return null
        }

        if (typeof title === 'string') {
            try {
                const parsed = JSON.parse(title) as unknown
                if (this.isLocalizedBlogTitle(parsed)) {
                    return parsed
                }
            } catch {
                return { nl: title, en: title }
            }

            return { nl: title, en: title }
        }

        if (this.isLocalizedBlogTitle(title)) {
            return title
        }

        return title as LocalizedBlogTitle | string | null
    }

    private isLocalizedBlogTitle(value: unknown): value is LocalizedBlogTitle {
        if (typeof value !== 'object' || value === null) {
            return false
        }

        const record = value as Record<string, unknown>
        return 'nl' in record || 'en' in record
    }

    private parseSearchDate(search: string): { from: Date; to: Date } | null {
        const trimmed = search.trim()
        if (!trimmed) return null

        const isoMatch = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/)
        const localMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)

        const year = isoMatch ? Number(isoMatch[1]) : localMatch ? Number(localMatch[3]) : NaN
        const month = isoMatch ? Number(isoMatch[2]) : localMatch ? Number(localMatch[2]) : NaN
        const day = isoMatch ? Number(isoMatch[3]) : localMatch ? Number(localMatch[1]) : NaN

        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null

        const from = new Date(Date.UTC(year, month - 1, day))
        if (
            from.getUTCFullYear() !== year ||
            from.getUTCMonth() !== month - 1 ||
            from.getUTCDate() !== day
        ) {
            return null
        }

        return { from, to: new Date(Date.UTC(year, month - 1, day + 1)) }
    }

    private buildBlogWhere(options: BlogSearchOptions): Prisma.blogWhereInput {
        const conditions: Prisma.blogWhereInput[] = [{ OR: [{ draft: false }, { draft: null }] }]
        const trimmedSearch = options.search?.trim()

        if (trimmedSearch) {
            const dateRange = this.parseSearchDate(trimmedSearch)
            const searchConditions: Prisma.blogWhereInput[] = [
                { title: { path: ['nl'], string_contains: trimmedSearch, mode: 'insensitive' } },
                { title: { path: ['en'], string_contains: trimmedSearch, mode: 'insensitive' } },
                { content: { path: ['nl'], string_contains: trimmedSearch, mode: 'insensitive' } },
                { content: { path: ['en'], string_contains: trimmedSearch, mode: 'insensitive' } },
            ]

            if (dateRange) {
                searchConditions.push({ created_at: { gte: dateRange.from, lt: dateRange.to } })
            }

            conditions.push({ OR: searchConditions })
        }

        if (options.yearFrom || options.yearTo) {
            const fromYear = Math.min(options.yearFrom ?? 1970, options.yearTo ?? 9999)
            const toYear = Math.max(options.yearFrom ?? 1970, options.yearTo ?? 9999)
            conditions.push({
                created_at: {
                    gte: new Date(Date.UTC(fromYear, 0, 1)),
                    lt: new Date(Date.UTC(toYear + 1, 0, 1)),
                },
            })
        }

        return conditions.length > 0 ? { AND: conditions } : {}
    }

    async findAllBlogs(options: BlogSearchOptions): Promise<BlogResponse[]> {
        const where = this.buildBlogWhere(options)

        const blogs = await this.prisma.blog.findMany({
            where,
            include: {
                blog_production: { select: { production_id: true } },
            },
            orderBy: { created_at: options.sort === 'oldest' ? 'asc' : 'desc' },
        })

        return blogs.map((blog) => ({
            id: blog.id,
            title: this.normalizeBlogTitle(blog.title),
            content: blog.content,
            thumbnail_index: blog.thumbnail_index,
            images: blog.images ?? [],
            productions: blog.blog_production.map((r) => r.production_id),
            created_at: blog.created_at,
            updated_at: blog.updated_at,
        }))
    }
}

