import type { Prisma, PrismaClient } from '@prisma/client'
import type { CreatePosterPersistenceInput, UpdatePosterInput } from './posters.schema.js'

type FindAllOptions = {
    page: number
    limit: number
    search?: string
    productionId?: string
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
    productions: Array<{
        id: string
        title: unknown
    }>
}

type PosterFileRecord = {
    created_at: Date
    updated_at: Date
    id: string
    name: string | null
    description: string | null
    file_location: string | null
    type: 'video' | 'image' | 'pdf' | 'other' | null
    gallery: {
        poster_gallery_productions: Array<{
            id: string
            title: Prisma.JsonValue
        }>
    } | null
}

function mapFileTypeToMime(type: PosterFileRecord['type']): string | null {
    if (type === 'pdf') {
        return 'application/pdf'
    }

    if (type === 'image') {
        return 'image/*'
    }

    return null
}

function mapMimeToFileType(mimeType: string): 'image' | 'pdf' {
    return mimeType === 'application/pdf' ? 'pdf' : 'image'
}

export class PostersRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private get productionInclude() {
        return {
            gallery: {
                select: {
                    poster_gallery_productions: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            },
        } as const
    }

    private mapPosterRecord(record: PosterFileRecord): PosterRecord {
        const productions = (record.gallery?.poster_gallery_productions ?? []).map((production) => ({
            id: production.id,
            title: production.title,
        }))

        const production = productions[0] ?? null

        return {
            created_at: record.created_at,
            updated_at: record.updated_at,
            id: record.id,
            title: record.name?.trim() || 'Untitled poster',
            file_path: record.file_location ?? '',
            mime_type: mapFileTypeToMime(record.type),
            original_filename: record.description ?? null,
            file_size_bytes: null,
            production_id: production?.id ?? '',
            production: production
                ? {
                      id: production.id,
                      title: production.title,
                  }
                : null,
            productions,
        }
    }

    private buildWhere(options: Pick<FindAllOptions, 'search' | 'productionId' | 'yearFrom' | 'yearTo'>): Prisma.fileWhereInput | undefined {
        const { search, productionId, yearFrom, yearTo } = options
        const where: Prisma.fileWhereInput = {
            type: {
                in: ['image', 'pdf'],
            },
            gallery: {
                is: {
                    poster_gallery_productions: {
                        some: {},
                    },
                },
            },
        }

        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            }
        }

        if (productionId) {
            where.gallery = {
                is: {
                    poster_gallery_productions: {
                        some: {
                            id: productionId,
                        },
                    },
                },
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

        const records = await this.prisma.file.findMany({
            where,
            orderBy: {
                created_at: sort === 'oldest' ? 'asc' : 'desc',
            },
            skip,
            take: limit,
            include: this.productionInclude,
        })

        return records.flatMap((record) => {
            if (!record.file_location) {
                return []
            }

            return [this.mapPosterRecord(record as PosterFileRecord)]
        })
    }

    async count(options: Pick<FindAllOptions, 'search' | 'productionId' | 'yearFrom' | 'yearTo'>) {
        return this.prisma.file.count({
            where: this.buildWhere(options),
        })
    }

    async findById(id: string) {
        const record = await this.prisma.file.findFirst({
            where: {
                id,
                ...this.buildWhere({}),
            },
            include: this.productionInclude,
        })

        if (!record || !record.file_location) {
            return null
        }

        return this.mapPosterRecord(record as PosterFileRecord)
    }

    private async ensurePosterGalleryForProductions(tx: Prisma.TransactionClient, productionIds: string[]) {
        const [primaryId, ...otherIds] = productionIds

        const primary = await tx.production.findUnique({
            where: { id: primaryId },
            select: { id: true, poster_gallery_id: true },
        })

        if (!primary) {
            throw new Error('Production not found')
        }

        let galleryId = primary.poster_gallery_id

        if (!galleryId) {
            const gallery = await tx.gallery.create({
                data: { name: `Posters for ${primary.id}` },
            })
            galleryId = gallery.id
            await tx.production.update({
                where: { id: primary.id },
                data: { poster_gallery_id: galleryId },
            })
        }

        for (const otherId of otherIds) {
            const other = await tx.production.findUnique({
                where: { id: otherId },
                select: { id: true, poster_gallery_id: true },
            })

            if (!other) {
                continue
            }

            if (other.poster_gallery_id !== galleryId) {
                await tx.production.update({
                    where: { id: otherId },
                    data: { poster_gallery_id: galleryId },
                })
            }
        }

        return galleryId
    }

    async create(data: CreatePosterPersistenceInput) {
        const record = await this.prisma.$transaction(async (tx) => {
            const galleryId = await this.ensurePosterGalleryForProductions(tx, data.production_ids)

            return tx.file.create({
                data: {
                    name: data.title,
                    description: data.original_filename ?? null,
                    gallery_id: galleryId,
                    file_location: data.file_path,
                    type: mapMimeToFileType((data.mime_type ?? '').toLowerCase()),
                },
                include: this.productionInclude,
            })
        })

        return this.mapPosterRecord(record as PosterFileRecord)
    }

    async update(id: string, data: UpdatePosterInput) {
        const existing = await this.findById(id)
        if (!existing) {
            throw new Error('Record to update not found')
        }

        const record = await this.prisma.$transaction(async (tx) => {
            const nextGalleryId = data.production_ids && data.production_ids.length > 0
                ? await this.ensurePosterGalleryForProductions(tx, data.production_ids)
                : undefined

            return tx.file.update({
                where: { id },
                data: {
                    ...(data.title !== undefined ? { name: data.title } : {}),
                    ...(nextGalleryId !== undefined ? { gallery_id: nextGalleryId } : {}),
                    updated_at: new Date(),
                },
                include: this.productionInclude,
            })
        })

        return this.mapPosterRecord(record as PosterFileRecord)
    }

    async delete(id: string) {
        const poster = await this.findById(id)

        if (!poster) {
            throw new Error('Record to delete does not exist')
        }

        await this.prisma.file.delete({ where: { id } })

        return poster
    }
}
