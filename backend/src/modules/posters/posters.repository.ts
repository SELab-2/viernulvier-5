import type { PrismaClient } from '@prisma/client'

type FindAllOptions = {
    page: number
    limit: number
    search?: string
    sort?: 'recent' | 'oldest'
}

type CreatePosterInput = {
    title: string
    file_path: string
    mime_type?: string | null
    original_filename?: string | null
    file_size_bytes?: number | null
    production_id: string
}

type UpdatePosterInput = {
    title?: string
    production_id?: string
}

export class PostersRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findAll(options: FindAllOptions) {
        const { page, limit, search, sort = 'recent' } = options
        const skip = (page - 1) * limit

        return this.prisma.poster.findMany({
            where: {
                title: search
                    ? {
                          contains: search,
                          mode: 'insensitive',
                      }
                    : undefined,
            },
            skip,
            take: limit,
            orderBy: {
                created_at: sort === 'oldest' ? 'asc' : 'desc',
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

    async count(options: Pick<FindAllOptions, 'search'>) {
        return this.prisma.poster.count({
            where: {
                title: options.search
                    ? {
                          contains: options.search,
                          mode: 'insensitive',
                      }
                    : undefined,
            },
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

    async create(data: CreatePosterInput) {
        return this.prisma.poster.create({
            data,
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
        return this.prisma.poster.update({
            where: { id },
            data,
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
        return this.prisma.poster.delete({
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
}
