import { Prisma, type PrismaClient } from '@prisma/client'
import {
    expandGenreTerms,
    type ProductionSearchLanguage,
    PRODUCTION_SEARCH_THRESHOLDS,
    PRODUCTION_SEARCH_WEIGHTS,
    getProductionSearchLanguageFallbacks,
    normalizeProductionSearchLanguage,
} from '../../domain/genre-aliases.js'

type FindAllOptions = {
    page: number
    limit: number
    search?: string
    searchIds?: string[]
    genres?: string[]
    locations?: string[]
    yearFrom?: number
    yearTo?: number
    onThisDayDate?: Date
    sort?: 'relevance' | 'recent' | 'oldest'
    lang?: string
}

type CountOptions = Omit<FindAllOptions, 'page' | 'limit' | 'sort'>

export class ProductionsRepository {
    private pgTrgmAvailable: boolean | null = null

    constructor(private readonly prisma: PrismaClient) { }

    private buildLocalizedTextExpression(
        column: 'title' | 'description_short' | 'description' | 'teaser',
        lang: ProductionSearchLanguage,
    ): Prisma.Sql {
        const fallbacks = getProductionSearchLanguageFallbacks(lang)
        const localizedCandidates = fallbacks.map((fallbackLang) => `p.${column} ->> '${fallbackLang}'`).join(', ')

        return Prisma.raw(`LOWER(COALESCE(${localizedCandidates}, ''))`)
    }

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

    private async findProductionIdsBySearch(search: string, lang = 'nl'): Promise<string[]> {
        const normalizedSearch = search.trim().toLowerCase()
        if (normalizedSearch.length === 0) {
            return []
        }

        const localizedLang = normalizeProductionSearchLanguage(lang)
        const titleText = this.buildLocalizedTextExpression('title', localizedLang)
        const descriptionShortText = this.buildLocalizedTextExpression('description_short', localizedLang)
        const descriptionText = this.buildLocalizedTextExpression('description', localizedLang)
        const teaserText = this.buildLocalizedTextExpression('teaser', localizedLang)
        const usePgTrgm = await this.ensurePgTrgmAvailable()

        if (usePgTrgm) {
            const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(
                Prisma.sql`
                    WITH source AS (
                        SELECT
                            p.id,
                            p.created_at,
                            ${titleText} AS title_text,
                            ${descriptionShortText} AS description_short_text,
                            ${descriptionText} AS description_text,
                            ${teaserText} AS teaser_text
                        FROM "production" p
                    )
                    SELECT id
                    FROM source
                    WHERE
                        title_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                        description_short_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                        description_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                        teaser_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                        similarity(title_text, CAST(${normalizedSearch} AS text)) >= ${PRODUCTION_SEARCH_THRESHOLDS.similarity} OR
                        similarity(description_short_text, CAST(${normalizedSearch} AS text)) >= ${PRODUCTION_SEARCH_THRESHOLDS.similarity} OR
                        similarity(description_text, CAST(${normalizedSearch} AS text)) >= ${PRODUCTION_SEARCH_THRESHOLDS.similarity} OR
                        similarity(teaser_text, CAST(${normalizedSearch} AS text)) >= ${PRODUCTION_SEARCH_THRESHOLDS.similarity} OR
                        word_similarity(title_text, CAST(${normalizedSearch} AS text)) >= ${PRODUCTION_SEARCH_THRESHOLDS.wordSimilarity} OR
                        word_similarity(description_short_text, CAST(${normalizedSearch} AS text)) >= ${PRODUCTION_SEARCH_THRESHOLDS.wordSimilarity} OR
                        word_similarity(description_text, CAST(${normalizedSearch} AS text)) >= ${PRODUCTION_SEARCH_THRESHOLDS.wordSimilarity} OR
                        word_similarity(teaser_text, CAST(${normalizedSearch} AS text)) >= ${PRODUCTION_SEARCH_THRESHOLDS.wordSimilarity}
                    ORDER BY (
                        CASE
                            WHEN title_text = CAST(${normalizedSearch} AS text) THEN ${PRODUCTION_SEARCH_WEIGHTS.titleExact}
                            WHEN title_text ILIKE CONCAT(CAST(${normalizedSearch} AS text), '%') THEN ${PRODUCTION_SEARCH_WEIGHTS.titlePrefix}
                            WHEN title_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN ${PRODUCTION_SEARCH_WEIGHTS.titleContains}
                            WHEN description_short_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN ${PRODUCTION_SEARCH_WEIGHTS.descriptionShortContains}
                            WHEN description_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN ${PRODUCTION_SEARCH_WEIGHTS.descriptionContains}
                            WHEN teaser_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN ${PRODUCTION_SEARCH_WEIGHTS.teaserContains}
                            ELSE 0
                        END
                        + (similarity(title_text, CAST(${normalizedSearch} AS text)) * ${PRODUCTION_SEARCH_WEIGHTS.titleSimilarity})
                        + (word_similarity(title_text, CAST(${normalizedSearch} AS text)) * ${PRODUCTION_SEARCH_WEIGHTS.titleWordSimilarity})
                        + (similarity(description_short_text, CAST(${normalizedSearch} AS text)) * ${PRODUCTION_SEARCH_WEIGHTS.descriptionShortSimilarity})
                        + (word_similarity(description_short_text, CAST(${normalizedSearch} AS text)) * ${PRODUCTION_SEARCH_WEIGHTS.descriptionShortWordSimilarity})
                        + (similarity(description_text, CAST(${normalizedSearch} AS text)) * ${PRODUCTION_SEARCH_WEIGHTS.descriptionSimilarity})
                        + (word_similarity(description_text, CAST(${normalizedSearch} AS text)) * ${PRODUCTION_SEARCH_WEIGHTS.descriptionWordSimilarity})
                        + (similarity(teaser_text, CAST(${normalizedSearch} AS text)) * ${PRODUCTION_SEARCH_WEIGHTS.teaserSimilarity})
                        + (word_similarity(teaser_text, CAST(${normalizedSearch} AS text)) * ${PRODUCTION_SEARCH_WEIGHTS.teaserWordSimilarity})
                    ) DESC, created_at DESC
                    LIMIT ${PRODUCTION_SEARCH_THRESHOLDS.maxResults}
                `,
            )

            return rows.map((row) => row.id)
        }

        const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(
            Prisma.sql`
                SELECT p.id
                FROM "production" p
                WHERE
                    ${titleText} ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    ${descriptionShortText} ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    ${descriptionText} ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    ${teaserText} ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%')
                ORDER BY p.created_at DESC
                LIMIT ${PRODUCTION_SEARCH_THRESHOLDS.maxResults}
            `,
        )

        return rows.map((row) => row.id)
    }

    async findSearchIds(search: string, lang = 'nl'): Promise<string[]> {
        return this.findProductionIdsBySearch(search, lang)
    }

    private async findProductionIdsOnMonthDay(date: Date): Promise<string[]> {
        const month = date.getUTCMonth() + 1
        const day = date.getUTCDate()

        const rows = await this.prisma.$queryRaw<Array<{ production_id: string }>>(
            Prisma.sql`
                SELECT DISTINCT production_id
                FROM "event"
                WHERE production_id IS NOT NULL
                  AND starts_at IS NOT NULL
                  AND EXTRACT(MONTH FROM starts_at) = ${month}
                  AND EXTRACT(DAY FROM starts_at) = ${day}
            `,
        )

        return rows
            .map((row) => row.production_id)
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
    }

    private async buildWhere(options: CountOptions): Promise<Prisma.productionWhereInput> {
        const { search, searchIds, genres, locations, yearFrom, yearTo, onThisDayDate, lang = 'nl' } = options
        const andFilters: Prisma.productionWhereInput[] = []

        if (onThisDayDate) {
            const matchingProductionIds = await this.findProductionIdsOnMonthDay(onThisDayDate)
            andFilters.push({
                id: {
                    in: matchingProductionIds,
                },
            })
        }

        if (search && search.trim().length > 0) {
            const matchingProductionIds = Array.isArray(searchIds)
                ? searchIds
                : await this.findProductionIdsBySearch(search, lang)
            andFilters.push({
                id: {
                    in: matchingProductionIds,
                },
            })
        }

        if (genres && genres.length > 0) {
            andFilters.push({
                genre_production: {
                    some: {
                        genre: {
                            OR: genres.flatMap((genre) => {
                                const searchTerms = expandGenreTerms(genre)
                                return searchTerms.flatMap((term) => [
                                    {
                                        name: {
                                            path: [lang],
                                            string_contains: term,
                                            mode: 'insensitive' as const,
                                        },
                                    },
                                    {
                                        name: {
                                            path: ['nl'],
                                            string_contains: term,
                                            mode: 'insensitive' as const,
                                        },
                                    },
                                    {
                                        name: {
                                            path: ['en'],
                                            string_contains: term,
                                            mode: 'insensitive' as const,
                                        },
                                    },
                                    {
                                        name: {
                                            path: ['fr'],
                                            string_contains: term,
                                            mode: 'insensitive' as const,
                                        },
                                    },
                                ])
                            }),
                        },
                    },
                },
            })
        }

        if (locations && locations.length > 0) {
            andFilters.push({
                OR: locations.map((location) => ({
                    OR: [
                        {
                            attendance_mode: {
                                equals: location,
                                mode: 'insensitive',
                            },
                        },
                        {
                            events: {
                                some: {
                                    hall: {
                                        OR: [
                                            {
                                                name: {
                                                    path: [lang],
                                                    string_contains: location,
                                                    mode: 'insensitive',
                                                },
                                            },
                                            {
                                                name: {
                                                    path: ['nl'],
                                                    string_contains: location,
                                                    mode: 'insensitive',
                                                },
                                            },
                                            {
                                                name: {
                                                    path: ['en'],
                                                    string_contains: location,
                                                    mode: 'insensitive',
                                                },
                                            },
                                            {
                                                name: {
                                                    path: ['fr'],
                                                    string_contains: location,
                                                    mode: 'insensitive',
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    ],
                })),
            })
        }

        if (typeof yearFrom === 'number' || typeof yearTo === 'number') {
            const createdAt: Prisma.DateTimeFilter = {}

            if (typeof yearFrom === 'number') {
                createdAt.gte = new Date(Date.UTC(yearFrom, 0, 1, 0, 0, 0, 0))
            }

            if (typeof yearTo === 'number') {
                createdAt.lte = new Date(Date.UTC(yearTo, 11, 31, 23, 59, 59, 999))
            }

            andFilters.push({ created_at: createdAt })
        }

        return andFilters.length > 0 ? { AND: andFilters } : {}
    }

    private buildOrderBy(sort?: 'relevance' | 'recent' | 'oldest'): Prisma.productionOrderByWithRelationInput {
        if (sort === 'oldest') {
            return { created_at: 'asc' }
        }

        return { created_at: 'desc' }
    }

    private get productionInclude() {
        return {
            poster_gallery: {
                include: {
                    items: {
                        take: 10,
                        orderBy: { created_at: 'asc' as const },
                        include: {
                            crops: {
                                orderBy: { created_at: 'asc' as const },
                            },
                        },
                    },
                },
            },
            media_gallery: {
                include: {
                    items: {
                        take: 10,
                        orderBy: { created_at: 'asc' as const },
                        include: {
                            crops: {
                                orderBy: { created_at: 'asc' as const },
                            },
                        },
                    },
                },
            },
            events: {
                take: 50,
                orderBy: { starts_at: 'asc' as const },
                include: {
                    hall: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            genre_production: {
                include: {
                    genre: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        }
    }

    async findAll(options: FindAllOptions) {
        const { page, limit, sort } = options
        const skip = (page - 1) * limit
        const where = await this.buildWhere(options)

        return this.prisma.production.findMany({
            where,
            skip,
            take: limit,
            orderBy: this.buildOrderBy(sort),
            include: this.productionInclude,
        })
    }

    async findFilteredIds(options: CountOptions & { rankedIds: string[] }): Promise<string[]> {
        const { rankedIds, ...countOptions } = options
        const filtersWithoutSearch = await this.buildWhere({ ...countOptions, search: undefined })

        const rows = await this.prisma.production.findMany({
            where: {
                AND: [
                    filtersWithoutSearch,
                    {
                        id: {
                            in: rankedIds,
                        },
                    },
                ],
            },
            select: {
                id: true,
            },
        })

        return rows.map((row) => row.id)
    }

    async findManyByIds(ids: string[]) {
        const rows = await this.prisma.production.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
            include: this.productionInclude,
        })

        const rowsById = new Map(rows.map((item) => [item.id, item]))
        return ids.map((id) => rowsById.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item))
    }

    async count(options: CountOptions) {
        const where = await this.buildWhere(options)

        return this.prisma.production.count({
            where,
        })
    }

    async findById(id: string) {
        const production = await this.prisma.production.findUnique({
            where: { id },
            include: {
                events: {
                    include: {
                        hall: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                genre_production: {
                    include: {
                        genre: true
                    }
                },
                poster_gallery: {
                    include: {
                        items: {
                            include: {
                                crops: true,
                            },
                        },
                    },
                },
                media_gallery: {
                    include: {
                        items: {
                            include: {
                                crops: true,
                            },
                        },
                    },
                },
                tag_production: {
                    include: {
                        tag: true,
                    },
                },
            }
        });

        if (!production) return null;

        return production;
    }

    async create(data: any) {
        return this.prisma.production.create({
            data,
        })
    }

    async update(id: string, data: any) {
        return this.prisma.production.update({
            where: { id },
            data,
        })
    }

    async delete(id: string) {
        return this.prisma.production.delete({
            where: { id }
        })
    }
}
