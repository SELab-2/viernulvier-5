import { Prisma, type PrismaClient } from '@prisma/client'
import type { SearchQuery, SearchResultItem } from './search.schema.js'
import { ProductionsRepository } from '../productions/productions.repository.js'

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
        const genreList = genres ? genres.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean) : []
        const locationList = locations ? locations.split(',').map((l) => l.trim().toLowerCase()).filter(Boolean) : []
        const localizedLang = lang === 'en' || lang === 'fr' ? lang : 'nl'
        const posterSortDateSql = sort === 'oldest'
            ? Prisma.sql`MIN(f.created_at) OVER (
                PARTITION BY COALESCE(f.gallery_id::text, ''), LOWER(TRIM(COALESCE(f.name, '')))
            )`
            : Prisma.sql`MAX(f.updated_at) OVER (
                PARTITION BY COALESCE(f.gallery_id::text, ''), LOWER(TRIM(COALESCE(f.name, '')))
            )`

        const includeProductions = tab === 'all' || tab === 'productions'
        const hasProductionOnlyFilters = genreList.length > 0 || locationList.length > 0
        const includePosters = (tab === 'all' || tab === 'posters') && !(tab === 'all' && hasProductionOnlyFilters)

        const productionsRepository = new ProductionsRepository(this.prisma)
        let allowedProductionIds: string[] = []

        if (includeProductions) {
            const normalizedGenres = genreList.length > 0 ? genreList : undefined
            const normalizedLocations = locationList.length > 0 ? locationList : undefined

            if (normalizedSearch) {
                const rankedIds = await productionsRepository.findSearchIds(normalizedSearch, localizedLang)
                allowedProductionIds = rankedIds.length > 0
                    ? await productionsRepository.findFilteredIds({
                        search: normalizedSearch,
                        searchIds: rankedIds,
                        lang: localizedLang,
                        genres: normalizedGenres,
                        locations: normalizedLocations,
                        yearFrom,
                        yearTo,
                        draft: false,
                        rankedIds,
                    })
                    : []
            } else {
                allowedProductionIds = await productionsRepository.findAllIds({
                    lang: localizedLang,
                    genres: normalizedGenres,
                    locations: normalizedLocations,
                    yearFrom,
                    yearTo,
                    draft: false,
                })
            }
        }

        const ctes: Prisma.Sql[] = []

        if (includeProductions) {
            ctes.push(Prisma.sql`
                production_rows AS (
                    SELECT
                        p.id,
                        p.title AS title_json,
                        COALESCE(
                            p.description_short ->> CAST(${localizedLang} AS text),
                            p.description_short ->> 'nl',
                            p.description_short ->> 'en',
                            p.description_short ->> 'fr',
                            p.teaser ->> CAST(${localizedLang} AS text),
                            p.teaser ->> 'nl',
                            p.teaser ->> 'en',
                            p.teaser ->> 'fr',
                            ''
                        ) AS excerpt,
                        (
                            SELECT '/api/v1/images/' || c.id
                            FROM "crop" c
                            JOIN "item" i ON i.id = c.item_id
                            JOIN "gallery" g ON g.id = i.gallery_id
                            WHERE g.id = p.media_gallery_id
                            ORDER BY CASE WHEN c.name = 'FE3_header' THEN 1 WHEN c.name = 'FE3_boxed' THEN 2 ELSE 3 END, i.position ASC, c.created_at DESC
                            LIMIT 1
                        ) AS image_url,
                        (
                            SELECT
                                CASE
                                    WHEN COUNT(e.id) = 1 THEN TO_CHAR(MIN(e.starts_at), 'DD/MM/YYYY')
                                    WHEN COUNT(DISTINCT EXTRACT(YEAR FROM e.starts_at)) = 1 THEN TO_CHAR(MIN(e.starts_at), 'DD/MM/YYYY') || ' - ' || TO_CHAR(MAX(e.starts_at), 'DD/MM/YYYY')
                                    ELSE CAST(EXTRACT(YEAR FROM MIN(e.starts_at)) AS TEXT) || ' - ' || CAST(EXTRACT(YEAR FROM MAX(e.starts_at)) AS TEXT)
                                END
                            FROM "event" e
                            WHERE e.production_id = p.id AND e.starts_at < NOW()
                        ) AS date_label,
                        (
                            SELECT STRING_AGG(DISTINCT COALESCE(h.name ->> CAST(${localizedLang} AS text), h.name ->> 'nl', h.name ->> 'en', h.name ->> 'fr', ''), ' • ')
                            FROM "event" e
                            JOIN "hall" h ON h.id = e.hall_id
                            WHERE e.production_id = p.id AND e.starts_at < NOW()
                        ) AS venue_label,
                        (
                            SELECT COALESCE(g.name ->> CAST(${localizedLang} AS text), g.name ->> 'nl', g.name ->> 'en', g.name ->> 'fr', '')
                            FROM "genre_production" gp
                            JOIN "genre" g ON g.id = gp.genre_id
                            WHERE gp.production_id = p.id
                            LIMIT 1
                        ) AS genre_label,
                        NULL::text AS mime_type,
                        NULL::integer AS poster_file_count,
                        NULL::uuid AS production_id,
                        p.created_at,
                        (SELECT MAX(e.starts_at) FROM "event" e WHERE e.production_id = p.id AND e.starts_at < NOW()) AS sort_date,
                        ${usePgTrgm && normalizedSearch ? Prisma.sql`
                            (CASE
                                WHEN LOWER(COALESCE(p.title ->> CAST(${localizedLang} AS text), p.title ->> 'nl', p.title ->> 'en', p.title ->> 'fr', '')) = CAST(${normalizedSearch} AS text) THEN 1000
                                WHEN LOWER(COALESCE(p.title ->> CAST(${localizedLang} AS text), p.title ->> 'nl', p.title ->> 'en', p.title ->> 'fr', '')) ILIKE CONCAT(CAST(${normalizedSearch} AS text), '%') THEN 900
                                WHEN LOWER(COALESCE(p.title ->> CAST(${localizedLang} AS text), p.title ->> 'nl', p.title ->> 'en', p.title ->> 'fr', '')) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 800
                                WHEN LOWER(COALESCE(p.description_short ->> CAST(${localizedLang} AS text), p.description_short ->> 'nl', p.description_short ->> 'en', p.description_short ->> 'fr', '')) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 380
                                WHEN LOWER(COALESCE(p.description ->> CAST(${localizedLang} AS text), p.description ->> 'nl', p.description ->> 'en', p.description ->> 'fr', '')) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 340
                                WHEN LOWER(COALESCE(p.teaser ->> CAST(${localizedLang} AS text), p.teaser ->> 'nl', p.teaser ->> 'en', p.teaser ->> 'fr', '')) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 320
                                ELSE 0
                            END
                            + (similarity(COALESCE(p.title ->> CAST(${localizedLang} AS text), p.title ->> 'nl', p.title ->> 'en', p.title ->> 'fr', ''), CAST(${normalizedSearch} AS text)) * 220)
                            + (similarity(COALESCE(p.description_short ->> CAST(${localizedLang} AS text), p.description_short ->> 'nl', p.description_short ->> 'en', p.description_short ->> 'fr', ''), CAST(${normalizedSearch} AS text)) * 80)
                            + (similarity(COALESCE(p.description ->> CAST(${localizedLang} AS text), p.description ->> 'nl', p.description ->> 'en', p.description ->> 'fr', ''), CAST(${normalizedSearch} AS text)) * 70)
                            + (similarity(COALESCE(p.teaser ->> CAST(${localizedLang} AS text), p.teaser ->> 'nl', p.teaser ->> 'en', p.teaser ->> 'fr', ''), CAST(${normalizedSearch} AS text)) * 60)
                            + (word_similarity(COALESCE(p.title ->> CAST(${localizedLang} AS text), p.title ->> 'nl', p.title ->> 'en', p.title ->> 'fr', ''), CAST(${normalizedSearch} AS text)) * 200)
                            + (word_similarity(COALESCE(p.description_short ->> CAST(${localizedLang} AS text), p.description_short ->> 'nl', p.description_short ->> 'en', p.description_short ->> 'fr', ''), CAST(${normalizedSearch} AS text)) * 70)
                            + (word_similarity(COALESCE(p.description ->> CAST(${localizedLang} AS text), p.description ->> 'nl', p.description ->> 'en', p.description ->> 'fr', ''), CAST(${normalizedSearch} AS text)) * 65)
                            + (word_similarity(COALESCE(p.teaser ->> CAST(${localizedLang} AS text), p.teaser ->> 'nl', p.teaser ->> 'en', p.teaser ->> 'fr', ''), CAST(${normalizedSearch} AS text)) * 55)
                            )
                        ` : Prisma.sql`0`} AS rank
                    FROM "production" p
                    WHERE
                        p.draft = FALSE
                        AND EXISTS (SELECT 1 FROM "event" e WHERE e.production_id = p.id AND e.starts_at < NOW())
                        ${allowedProductionIds.length > 0 ? Prisma.sql`AND p.id IN (${Prisma.join(allowedProductionIds)})` : Prisma.sql`AND FALSE`}
                )
            `)
        }

        if (includePosters) {
            ctes.push(Prisma.sql`
                poster_rows AS (
                    SELECT
                        f.id,
                        jsonb_build_object(
                            'nl', COALESCE(NULLIF(TRIM(f.name), ''), 'Untitled poster'),
                            'en', COALESCE(NULLIF(TRIM(f.name), ''), 'Untitled poster')
                        ) AS title_json,
                        '' AS excerpt,
                        '/api/v1/archive/posters/' || f.id || '/file' AS image_url,
                        TO_CHAR(f.created_at, 'DD/MM/YYYY') AS date_label,
                        COALESCE(
                            (
                                SELECT p.title ->> CAST(${localizedLang} AS text)
                                FROM "production" p
                                WHERE p.poster_gallery_id = f.gallery_id
                                ORDER BY p.id ASC
                                LIMIT 1
                            ),
                            (
                                SELECT p.title ->> 'nl'
                                FROM "production" p
                                WHERE p.poster_gallery_id = f.gallery_id
                                ORDER BY p.id ASC
                                LIMIT 1
                            ),
                            (
                                SELECT p.title ->> 'en'
                                FROM "production" p
                                WHERE p.poster_gallery_id = f.gallery_id
                                ORDER BY p.id ASC
                                LIMIT 1
                            ),
                            (
                                SELECT p.title ->> 'fr'
                                FROM "production" p
                                WHERE p.poster_gallery_id = f.gallery_id
                                ORDER BY p.id ASC
                                LIMIT 1
                            ),
                            ''
                        ) AS venue_label,
                        'Poster' AS genre_label,
                        CASE WHEN f.type = 'pdf' THEN 'application/pdf' ELSE NULL END AS mime_type,
                        CAST(COUNT(*) OVER (
                            PARTITION BY COALESCE(f.gallery_id::text, ''), LOWER(TRIM(COALESCE(f.name, '')))
                        ) AS integer) AS poster_file_count,
                        (
                            SELECT p.id
                            FROM "production" p
                            WHERE p.poster_gallery_id = f.gallery_id
                            ORDER BY p.id ASC
                            LIMIT 1
                        ) AS production_id,
                        f.created_at,
                        ${posterSortDateSql} AS sort_date,
                        ${usePgTrgm && normalizedSearch ? Prisma.sql`
                            (CASE
                                WHEN LOWER(COALESCE(f.name, '')) = CAST(${normalizedSearch} AS text) THEN 1000
                                WHEN LOWER(COALESCE(f.name, '')) ILIKE CONCAT(CAST(${normalizedSearch} AS text), '%') THEN 900
                                WHEN LOWER(COALESCE(f.name, '')) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 800
                                ELSE 0
                            END
                            + (similarity(COALESCE(f.name, ''), CAST(${normalizedSearch} AS text)) * 220)
                            + (word_similarity(COALESCE(f.name, ''), CAST(${normalizedSearch} AS text)) * 200)
                            )
                        ` : Prisma.sql`0`} AS rank,
                        ROW_NUMBER() OVER (
                            PARTITION BY COALESCE(f.gallery_id::text, ''), LOWER(TRIM(COALESCE(f.name, '')))
                            ORDER BY f.created_at ASC, f.id ASC
                        ) AS row_number
                    FROM "file" f
                    WHERE
                        f.type IN ('image', 'pdf')
                        AND f.file_location IS NOT NULL
                        ${normalizedSearch ? Prisma.sql` AND LOWER(COALESCE(f.name, '')) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%')` : Prisma.empty}
                        ${yearFrom ? Prisma.sql` AND EXTRACT(YEAR FROM f.created_at) >= ${yearFrom}` : Prisma.empty}
                        ${yearTo ? Prisma.sql` AND EXTRACT(YEAR FROM f.created_at) <= ${yearTo}` : Prisma.empty}
                )
            `)
        }

        const withClause = ctes.length > 0 ? Prisma.sql`WITH ${Prisma.join(ctes, ', ')}` : Prisma.empty

        const countQuery = Prisma.sql`
            ${withClause}
            SELECT (
                ${includeProductions ? Prisma.sql`(SELECT COUNT(*) FROM production_rows)` : Prisma.sql`0`} +
                ${includePosters ? Prisma.sql`(SELECT COUNT(*) FROM poster_rows WHERE row_number = 1)` : Prisma.sql`0`}
            ) AS total
        `

        const topIdsQuery = Prisma.sql`
            ${withClause}
            SELECT id, type
            FROM (
                ${includeProductions ? Prisma.sql`SELECT id, 'production' AS type, sort_date, rank FROM production_rows` : Prisma.empty}
                ${includeProductions && includePosters ? Prisma.sql` UNION ALL ` : Prisma.empty}
                ${includePosters ? Prisma.sql`SELECT id, 'poster' AS type, sort_date, rank FROM poster_rows WHERE row_number = 1` : Prisma.empty}
            ) matches
            ORDER BY
                ${sort === 'relevance' ? Prisma.sql`rank DESC, sort_date DESC` : sort === 'oldest' ? Prisma.sql`sort_date ASC` : Prisma.sql`sort_date DESC`}
            LIMIT ${limit} OFFSET ${offset}
        `

        const [totalResult, topIds] = await Promise.all([
            this.prisma.$queryRaw<Array<{ total: bigint }>>(countQuery),
            this.prisma.$queryRaw<Array<{ id: string; type: string }>>(topIdsQuery),
        ])

        const total = Number(totalResult[0]?.total ?? 0)
        if (topIds.length === 0) {
            return { items: [], total }
        }

        const productionIds = topIds.filter((item) => item.type === 'production').map((item) => item.id)
        const posterIds = topIds.filter((item) => item.type === 'poster').map((item) => item.id)

        const richItemsQuery = Prisma.sql`
            ${withClause}
            SELECT
                id,
                type,
                title_json,
                excerpt,
                image_url,
                date_label,
                venue_label,
                genre_label,
                mime_type,
                poster_file_count,
                production_id,
                created_at
            FROM (
                ${productionIds.length > 0 ? Prisma.sql`
                    SELECT
                        id,
                        'production' AS type,
                        title_json,
                        excerpt,
                        image_url,
                        date_label,
                        venue_label,
                        genre_label,
                        mime_type,
                        poster_file_count,
                        production_id,
                        created_at
                    FROM production_rows
                    WHERE id IN (${Prisma.join(productionIds)})
                ` : Prisma.empty}
                ${productionIds.length > 0 && posterIds.length > 0 ? Prisma.sql` UNION ALL ` : Prisma.empty}
                ${posterIds.length > 0 ? Prisma.sql`
                    SELECT
                        id,
                        'poster' AS type,
                        title_json,
                        excerpt,
                        image_url,
                        date_label,
                        venue_label,
                        genre_label,
                        mime_type,
                        poster_file_count,
                        production_id,
                        created_at
                    FROM poster_rows
                    WHERE id IN (${Prisma.join(posterIds)}) AND row_number = 1
                ` : Prisma.empty}
            ) rich_results
        `

        const richItems = await this.prisma.$queryRaw<any[]>(richItemsQuery)
        const itemsMap = new Map(richItems.map((item) => [item.id, item]))

        const items = topIds.map((top) => {
            const item = itemsMap.get(top.id)
            if (!item) {
                return null
            }

            return {
                id: item.id,
                type: item.type as 'production' | 'poster',
                title: item.title_json,
                excerpt: this.stripHtml(item.excerpt).substring(0, 200),
                image_url: item.image_url,
                date_label: item.date_label,
                venue_label: item.venue_label,
                genre_label: item.genre_label,
                mime_type: item.mime_type,
                poster_file_count: item.poster_file_count ?? undefined,
                production_id: item.production_id ?? null,
                created_at: item.created_at.toISOString(),
            } as SearchResultItem
        }).filter((item): item is SearchResultItem => item !== null)

        return { items, total }
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
}

