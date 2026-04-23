import type { Prisma, PrismaClient } from '@prisma/client'
import type { CreatePosterPersistenceInput, UpdatePosterInput } from './posters.schema.js'

type FindAllOptions = {
    page: number
    limit: number
    search?: string
    yearFrom?: number
    yearTo?: number
    sort?: 'recent' | 'oldest'
}

export type PosterRecord = {
    created_at: Date
    updated_at: Date
    id: string
    title: string
    file_path: string
    mime_type: string | null
    original_filename: string | null
    file_size_bytes: number | null
    production_id: string
    production: {
        id: string
        title: unknown
    } | null
}

export class PostersRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private buildWhere(options: Pick<FindAllOptions, 'search' | 'yearFrom' | 'yearTo'>): Prisma.posterWhereInput | undefined {
        const { search, yearFrom, yearTo } = options
        const where: Prisma.posterWhereInput = {}

        if (search) {
            where.title = {
                contains: search,
                mode: 'insensitive',
            }
        }

        if (typeof yearFrom === 'number' || typeof yearTo === 'number') {
            where.created_at = {
                ...(typeof yearFrom === 'number' ? { gte: new Date(Date.UTC(yearFrom, 0, 1, 0, 0, 0, 0)) } : {}),
                ...(typeof yearTo === 'number' ? { lte: new Date(Date.UTC(yearTo, 11, 31, 23, 59, 59, 999)) } : {}),
            }
        }

        return Object.keys(where).length > 0 ? where : undefined
    }

    async findAll(options: FindAllOptions) {
        const { page, limit, sort = 'recent' } = options
        const skip = (page - 1) * limit
        const where = this.buildWhere(options)

        return this.prisma.poster.findMany({
            where,
            orderBy: {
                created_at: sort === 'oldest' ? 'asc' : 'desc',
            },
            skip,
            take: limit,
            include: {
                production: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })
    }

    async count(options: Pick<FindAllOptions, 'search' | 'yearFrom' | 'yearTo'>) {
        return this.prisma.poster.count({
            where: this.buildWhere(options),
        })
    }

    async findById(id: string) {
        return this.prisma.poster.findUnique({
            where: { id },
            include: {
                production: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })
    }

    async create(data: CreatePosterPersistenceInput) {
        return this.prisma.poster.create({
            data: {
                title: data.title,
                file_path: data.file_path,
                mime_type: data.mime_type ?? null,
                original_filename: data.original_filename ?? null,
                file_size_bytes: data.file_size_bytes ?? null,
                production_id: data.production_id,
            },
            include: {
                production: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })
    }

    async update(id: string, data: UpdatePosterInput) {
        const existing = await this.findById(id)
        if (!existing) {
            throw new Error('Record to update not found')
        }

        return this.prisma.poster.update({
            where: { id },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
                ...(data.production_id !== undefined ? { production_id: data.production_id } : {}),
                updated_at: new Date(),
            },
            include: {
                production: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        })
    }

    async delete(id: string) {
        const poster = await this.findById(id)

        if (!poster) {
            throw new Error('Record to delete does not exist')
        }

        await this.prisma.poster.delete({ where: { id } })

        return poster
    }
}
