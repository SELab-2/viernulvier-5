import { Prisma, type PrismaClient } from '@prisma/client'

type FindAllOptions = {
    page: number
    limit: number
    search?: string
    genres?: string[]
    locations?: string[]
    yearFrom?: number
    yearTo?: number
    sort?: 'relevance' | 'recent' | 'oldest'
    lang?: string
}

type CountOptions = Omit<FindAllOptions, 'page' | 'limit' | 'sort'>

export class ProductionsRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private buildWhere(options: CountOptions): Prisma.productionWhereInput {
        const { search, genres, locations, yearFrom, yearTo, lang = 'nl' } = options
        const andFilters: Prisma.productionWhereInput[] = []

        if (search && search.trim().length > 0) {
            const normalizedSearch = search.trim()
            andFilters.push({
                OR: [
                    {
                        title: {
                            path: [lang],
                            string_contains: normalizedSearch,
                        },
                    },
                    {
                        description_short: {
                            path: [lang],
                            string_contains: normalizedSearch,
                        },
                    },
                    {
                        teaser: {
                            path: [lang],
                            string_contains: normalizedSearch,
                        },
                    },
                ],
            })
        }

        if (genres && genres.length > 0) {
            andFilters.push({
                genre_production: {
                    some: {
                        genre: {
                            OR: genres.map((genre) => ({
                                name: {
                                    path: [lang],
                                    string_contains: genre,
                                },
                            })),
                        },
                    },
                },
            })
        }

        if (locations && locations.length > 0) {
            andFilters.push({
                OR: locations.map((location) => ({
                    attendance_mode: {
                        equals: location,
                        mode: 'insensitive',
                    },
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
        const { page, limit, sort } = options
        const skip = (page - 1) * limit
        const where = this.buildWhere(options)

        return this.prisma.production.findMany({
            where,
            skip,
            take: limit,
            orderBy: this.buildOrderBy(sort),
            include: {
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
        const where = this.buildWhere(options)

        return this.prisma.production.count({
            where,
        })
    }

    async findById(id: string) {
        return this.prisma.production.findUnique({
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
            }
        })
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
