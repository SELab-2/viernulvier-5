import { Prisma, type PrismaClient } from '@prisma/client'

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

        const normalizedLang = lang.trim().toLowerCase()
        const localizedLang = normalizedLang === 'en' || normalizedLang === 'fr' ? normalizedLang : 'nl'
        const usePgTrgm = await this.ensurePgTrgmAvailable()

        if (usePgTrgm) {
            const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(
                Prisma.sql`
                    WITH source AS (
                        SELECT
                            p.id,
                            p.created_at,
                            LOWER(CASE
                                WHEN ${localizedLang} = 'en' THEN COALESCE(p.title ->> 'en', p.title ->> 'nl', p.title ->> 'fr', '')
                                WHEN ${localizedLang} = 'fr' THEN COALESCE(p.title ->> 'fr', p.title ->> 'nl', p.title ->> 'en', '')
                                ELSE COALESCE(p.title ->> 'nl', p.title ->> 'en', p.title ->> 'fr', '')
                            END) AS title_text,
                            LOWER(CASE
                                WHEN ${localizedLang} = 'en' THEN COALESCE(p.description_short ->> 'en', p.description_short ->> 'nl', p.description_short ->> 'fr', '')
                                WHEN ${localizedLang} = 'fr' THEN COALESCE(p.description_short ->> 'fr', p.description_short ->> 'nl', p.description_short ->> 'en', '')
                                ELSE COALESCE(p.description_short ->> 'nl', p.description_short ->> 'en', p.description_short ->> 'fr', '')
                            END) AS description_short_text,
                            LOWER(CASE
                                WHEN ${localizedLang} = 'en' THEN COALESCE(p.description ->> 'en', p.description ->> 'nl', p.description ->> 'fr', '')
                                WHEN ${localizedLang} = 'fr' THEN COALESCE(p.description ->> 'fr', p.description ->> 'nl', p.description ->> 'en', '')
                                ELSE COALESCE(p.description ->> 'nl', p.description ->> 'en', p.description ->> 'fr', '')
                            END) AS description_text,
                            LOWER(CASE
                                WHEN ${localizedLang} = 'en' THEN COALESCE(p.teaser ->> 'en', p.teaser ->> 'nl', p.teaser ->> 'fr', '')
                                WHEN ${localizedLang} = 'fr' THEN COALESCE(p.teaser ->> 'fr', p.teaser ->> 'nl', p.teaser ->> 'en', '')
                                ELSE COALESCE(p.teaser ->> 'nl', p.teaser ->> 'en', p.teaser ->> 'fr', '')
                            END) AS teaser_text
                        FROM "production" p
                    )
                    SELECT id
                    FROM source
                    WHERE
                        title_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                        description_short_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                        description_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                        teaser_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                        similarity(title_text, CAST(${normalizedSearch} AS text)) >= 0.2 OR
                        similarity(description_short_text, CAST(${normalizedSearch} AS text)) >= 0.2 OR
                        similarity(description_text, CAST(${normalizedSearch} AS text)) >= 0.2 OR
                        similarity(teaser_text, CAST(${normalizedSearch} AS text)) >= 0.2 OR
                        word_similarity(title_text, CAST(${normalizedSearch} AS text)) >= 0.45 OR
                        word_similarity(description_short_text, CAST(${normalizedSearch} AS text)) >= 0.45 OR
                        word_similarity(description_text, CAST(${normalizedSearch} AS text)) >= 0.45 OR
                        word_similarity(teaser_text, CAST(${normalizedSearch} AS text)) >= 0.45
                    ORDER BY (
                        CASE
                            WHEN title_text = CAST(${normalizedSearch} AS text) THEN 1000
                            WHEN title_text ILIKE CONCAT(CAST(${normalizedSearch} AS text), '%') THEN 900
                            WHEN title_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 800
                            WHEN description_short_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 380
                            WHEN description_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 340
                            WHEN teaser_text ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') THEN 320
                            ELSE 0
                        END
                        + (similarity(title_text, CAST(${normalizedSearch} AS text)) * 220)
                        + (word_similarity(title_text, CAST(${normalizedSearch} AS text)) * 200)
                        + (similarity(description_short_text, CAST(${normalizedSearch} AS text)) * 80)
                        + (word_similarity(description_short_text, CAST(${normalizedSearch} AS text)) * 70)
                        + (similarity(description_text, CAST(${normalizedSearch} AS text)) * 70)
                        + (word_similarity(description_text, CAST(${normalizedSearch} AS text)) * 65)
                        + (similarity(teaser_text, CAST(${normalizedSearch} AS text)) * 60)
                        + (word_similarity(teaser_text, CAST(${normalizedSearch} AS text)) * 55)
                    ) DESC, created_at DESC
                    LIMIT 5000
                `,
            )

            return rows.map((row) => row.id)
        }

        const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(
            Prisma.sql`
                SELECT p.id
                FROM "production" p
                WHERE
                    LOWER(CASE
                        WHEN ${localizedLang} = 'en' THEN COALESCE(p.title ->> 'en', p.title ->> 'nl', p.title ->> 'fr', '')
                        WHEN ${localizedLang} = 'fr' THEN COALESCE(p.title ->> 'fr', p.title ->> 'nl', p.title ->> 'en', '')
                        ELSE COALESCE(p.title ->> 'nl', p.title ->> 'en', p.title ->> 'fr', '')
                    END) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(CASE
                        WHEN ${localizedLang} = 'en' THEN COALESCE(p.description_short ->> 'en', p.description_short ->> 'nl', p.description_short ->> 'fr', '')
                        WHEN ${localizedLang} = 'fr' THEN COALESCE(p.description_short ->> 'fr', p.description_short ->> 'nl', p.description_short ->> 'en', '')
                        ELSE COALESCE(p.description_short ->> 'nl', p.description_short ->> 'en', p.description_short ->> 'fr', '')
                    END) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(CASE
                        WHEN ${localizedLang} = 'en' THEN COALESCE(p.description ->> 'en', p.description ->> 'nl', p.description ->> 'fr', '')
                        WHEN ${localizedLang} = 'fr' THEN COALESCE(p.description ->> 'fr', p.description ->> 'nl', p.description ->> 'en', '')
                        ELSE COALESCE(p.description ->> 'nl', p.description ->> 'en', p.description ->> 'fr', '')
                    END) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%') OR
                    LOWER(CASE
                        WHEN ${localizedLang} = 'en' THEN COALESCE(p.teaser ->> 'en', p.teaser ->> 'nl', p.teaser ->> 'fr', '')
                        WHEN ${localizedLang} = 'fr' THEN COALESCE(p.teaser ->> 'fr', p.teaser ->> 'nl', p.teaser ->> 'en', '')
                        ELSE COALESCE(p.teaser ->> 'nl', p.teaser ->> 'en', p.teaser ->> 'fr', '')
                    END) ILIKE CONCAT('%', CAST(${normalizedSearch} AS text), '%')
                ORDER BY p.created_at DESC
                LIMIT 5000
            `,
        )

        return rows.map((row) => row.id)
    }

    private expandGenreTerms(genre: string): string[] {
        const normalized = genre.trim().toLowerCase()
        if (!normalized) {
            return []
        }

        const fromAliases = GENRE_SEARCH_ALIASES[normalized] ?? [normalized]
        return Array.from(new Set(fromAliases))
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
                                const searchTerms = this.expandGenreTerms(genre)
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

    async findAll(options: FindAllOptions) {
        const { page, limit, sort, search, searchIds, lang } = options
        const skip = (page - 1) * limit

        if (sort === 'relevance' && search && search.trim().length > 0) {
            const rankedSearchIds = Array.isArray(searchIds)
                ? searchIds
                : await this.findProductionIdsBySearch(search, lang)
            if (rankedSearchIds.length === 0) {
                return []
            }

            const filtersWithoutSearch = await this.buildWhere({
                ...options,
                search: undefined,
            })

            const filteredIds = await this.prisma.production.findMany({
                where: {
                    AND: [
                        filtersWithoutSearch,
                        {
                            id: {
                                in: rankedSearchIds,
                            },
                        },
                    ],
                },
                select: {
                    id: true,
                },
            })

            const filteredIdSet = new Set(filteredIds.map((item) => item.id))
            const orderedFilteredIds = rankedSearchIds.filter((id) => filteredIdSet.has(id))
            const pagedIds = orderedFilteredIds.slice(skip, skip + limit)

            if (pagedIds.length === 0) {
                return []
            }

            const rows = await this.prisma.production.findMany({
                where: {
                    id: {
                        in: pagedIds,
                    },
                },
                include: {
                    poster: {
                        select: {
                            id: true,
                            title: true,
                            mime_type: true,
                            original_filename: true,
                            file_size_bytes: true,
                            created_at: true,
                            updated_at: true,
                        },
                    },
                    poster_gallery: {
                        include: {
                            items: {
                                take: 10,
                                orderBy: { created_at: 'asc' },
                                include: {
                                    crops: {
                                        orderBy: { created_at: 'asc' },
                                    },
                                },
                            },
                        },
                    },
                    media_gallery: {
                        include: {
                            items: {
                                take: 10,
                                orderBy: { created_at: 'asc' },
                                include: {
                                    crops: {
                                        orderBy: { created_at: 'asc' },
                                    },
                                },
                            },
                        },
                    },
                    events: {
                        take: 50,
                        orderBy: { starts_at: 'asc' },
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
                },
            })

            const rowsById = new Map(rows.map((item) => [item.id, item]))
            return pagedIds.map((id) => rowsById.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item))
        }

        const where = await this.buildWhere(options)

        return this.prisma.production.findMany({
            where,
            skip,
            take: limit,
            orderBy: this.buildOrderBy(sort),
            include: {
                poster: {
                    select: {
                        id: true,
                        title: true,
                        mime_type: true,
                        original_filename: true,
                        file_size_bytes: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
                poster_gallery: {
                    include: {
                        items: {
                            take: 10,
                            orderBy: { created_at: 'asc' },
                            include: {
                                crops: {
                                    orderBy: { created_at: 'asc' },
                                },
                            },
                        },
                    },
                },
                media_gallery: {
                    include: {
                        items: {
                            take: 10,
                            orderBy: { created_at: 'asc' },
                            include: {
                                crops: {
                                    orderBy: { created_at: 'asc' },
                                },
                            },
                        },
                    },
                },
                events: {
                    take: 50,
                    orderBy: { starts_at: 'asc' },
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
            },
        })
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
                poster: {
                    select: {
                        id: true,
                        title: true,
                        mime_type: true,
                        original_filename: true,
                        file_size_bytes: true,
                        created_at: true,
                        updated_at: true,
                    },
                },
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
