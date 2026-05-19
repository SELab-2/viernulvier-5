import { Prisma, type PrismaClient } from '@prisma/client'
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
    files: Array<{
        id: string
        file_path: string
        mime_type: string | null
        original_filename: string | null
        file_size_bytes: number | null
    }>
    productions: Array<{
        id: string
        title: unknown
    }>
}

export type PosterFileStreamRecord = {
    file_path: string
    mime_type: string | null
}

export type RecentPosterRecord = Pick<PosterRecord, 'id' | 'title' | 'updated_at'>

type PosterFileRecord = {
    created_at: Date
    updated_at: Date
    id: string
    name: string | null
    description: string | null
    gallery_id: string | null
    file_location: string | null
    type: 'video' | 'image' | 'pdf' | 'other' | null
    gallery?: {
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
        return null
    }

    return null
}

function mapMimeToFileType(mimeType: string): 'image' | 'pdf' {
    return mimeType === 'application/pdf' ? 'pdf' : 'image'
}

export class PostersRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private getPosterGroupKey(record: PosterFileRecord): string {
        return `${record.gallery_id ?? ''}::${(record.name ?? '').trim().toLowerCase()}`
    }

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

    private mapPosterRecord(groupRecords: PosterFileRecord[]): PosterRecord {
        const representative = groupRecords[0]
        const productions = (representative.gallery?.poster_gallery_productions ?? []).map((production) => ({
            id: production.id,
            title: production.title,
        }))

        const createdAtMs = groupRecords.map((entry) => entry.created_at.getTime())
        const updatedAtMs = groupRecords.map((entry) => entry.updated_at.getTime())

        const files = groupRecords.flatMap((entry) => {
            if (!entry.file_location) {
                return []
            }

            return [
                {
                    id: entry.id,
                    file_path: entry.file_location,
                    mime_type: mapFileTypeToMime(entry.type),
                    original_filename: entry.description ?? null,
                    file_size_bytes: null,
                },
            ]
        })

        return {
            created_at: new Date(Math.min(...createdAtMs)),
            updated_at: new Date(Math.max(...updatedAtMs)),
            id: representative.id,
            title: representative.name?.trim() || 'Untitled poster',
            file_path: representative.file_location ?? '',
            mime_type: mapFileTypeToMime(representative.type),
            original_filename: representative.description ?? null,
            file_size_bytes: null,
            files,
            productions,
        }
    }

    private groupPosterRecords(records: PosterFileRecord[]): PosterRecord[] {
        const grouped = new Map<string, PosterFileRecord[]>()

        for (const record of records) {
            if (!record.file_location) {
                continue
            }

            const key = this.getPosterGroupKey(record)
            const current = grouped.get(key) ?? []
            current.push(record)
            grouped.set(key, current)
        }

        return Array.from(grouped.values()).map((group) =>
            this.mapPosterRecord([...group].sort((a, b) => a.created_at.getTime() - b.created_at.getTime())),
        )
    }

    private buildWhere(options: Pick<FindAllOptions, 'search' | 'productionId' | 'yearFrom' | 'yearTo'>): Prisma.fileWhereInput | undefined {
        const { search, productionId, yearFrom, yearTo } = options
        const where: Prisma.fileWhereInput = {
            type: {
                in: ['image', 'pdf'],
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
        const where = this.buildWhere(options)

        const records = await this.prisma.file.findMany({
            where,
            orderBy: {
                created_at: sort === 'oldest' ? 'asc' : 'desc',
            },
            include: this.productionInclude,
        })

        const grouped = this.groupPosterRecords(records as PosterFileRecord[])
        const sorted = grouped.sort((a, b) => {
            if (sort === 'oldest') {
                return a.created_at.getTime() - b.created_at.getTime()
            }

            return b.updated_at.getTime() - a.updated_at.getTime()
        })

        const skip = (page - 1) * limit
        return sorted.slice(skip, skip + limit)
    }

    async findRecent(limit: number): Promise<RecentPosterRecord[]> {
        return this.prisma.$queryRaw<RecentPosterRecord[]>(Prisma.sql`
            WITH ranked_posters AS (
                SELECT
                    id,
                    COALESCE(NULLIF(TRIM(name), ''), 'Untitled poster') AS title,
                    updated_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(gallery_id::text, ''), LOWER(TRIM(COALESCE(name, '')))
                        ORDER BY updated_at DESC, id DESC
                    ) AS row_number
                FROM file
                WHERE type IN ('image'::filetype, 'pdf'::filetype)
                    AND file_location IS NOT NULL
            )
            SELECT id, title, updated_at
            FROM ranked_posters
            WHERE row_number = 1
            ORDER BY updated_at DESC, id DESC
            LIMIT ${limit}
        `)
    }

    async count(options: Pick<FindAllOptions, 'search' | 'productionId' | 'yearFrom' | 'yearTo'>) {
        const records = await this.prisma.file.findMany({
            where: this.buildWhere(options),
            select: {
                id: true,
                gallery_id: true,
                name: true,
            },
        })

        const groups = new Set(records.map((record) => `${record.gallery_id ?? ''}::${(record.name ?? '').trim().toLowerCase()}`))
        return groups.size
    }



    async countInRange({ from, to }: { from: Date; to: Date }) {
        const records = await this.prisma.file.findMany({
            where: {
                ...this.buildWhere({}),
                created_at: {
                    gte: from,
                    lt: to,
                },
            },
            select: {
                id: true,
                gallery_id: true,
                name: true,
            },
        })

        const groups = new Set(records.map((record) => `${record.gallery_id ?? ''}::${(record.name ?? '').trim().toLowerCase()}`))
        return groups.size
    }

    async findById(id: string) {
        const record = await this.prisma.file.findFirst({
            where: {
                id,
                ...this.buildWhere({}),
            },
            include: this.productionInclude,
        })

        if (!record) {
            return null
        }

        const groupRecords = await this.prisma.file.findMany({
            where: {
                ...this.buildWhere({}),
                gallery_id: record.gallery_id,
                name: record.name,
            },
            include: this.productionInclude,
        })

        const grouped = this.groupPosterRecords(groupRecords as PosterFileRecord[])
        return grouped[0] ?? null
    }

    async findFileById(id: string): Promise<PosterFileStreamRecord | null> {
        const record = await this.prisma.file.findFirst({
            where: {
                id,
                ...this.buildWhere({}),
            },
            select: {
                file_location: true,
                type: true,
            },
        })

        if (!record?.file_location) {
            return null
        }

        return {
            file_path: record.file_location,
            mime_type: mapFileTypeToMime(record.type),
        }
    }

    private async ensurePosterGalleryForProductions(tx: Prisma.TransactionClient, productionIds: string[]) {
        const [primaryId, ...otherIds] = productionIds

        const requestedIds = Array.from(new Set(productionIds))
        const linkedProductions = await tx.production.findMany({
            where: {
                id: {
                    in: requestedIds,
                },
            },
            select: {
                id: true,
                poster_gallery_id: true,
            },
        })

        const linkedById = new Map(linkedProductions.map((production) => [production.id, production]))
        const unknownProductionIds = requestedIds.filter((id) => !linkedById.has(id))
        if (unknownProductionIds.length > 0) {
            throw new Error(`Unknown production IDs: ${unknownProductionIds.join(', ')}`)
        }

        const primary = linkedById.get(primaryId)

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
            const other = linkedById.get(otherId)

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
        const createdId = await this.prisma.$transaction(async (tx) => {
            const galleryId = data.production_ids.length > 0
                ? await this.ensurePosterGalleryForProductions(tx, data.production_ids)
                : (await tx.gallery.create({
                    data: { name: `Unassigned poster ${Date.now()}` },
                    select: { id: true },
                })).id

            const createdRecords = await Promise.all(
                data.files.map((file, index) =>
                    tx.file.create({
                        data: {
                            name: data.title,
                            description: file.original_filename ?? null,
                            gallery_id: galleryId,
                            file_location: file.file_path,
                            type: mapMimeToFileType((file.mime_type ?? '').toLowerCase()),
                            created_at: new Date(Date.now() + index),
                        },
                        select: { id: true },
                    }),
                ),
            )

            return createdRecords[0]?.id ?? null
        })

        if (!createdId) {
            throw new Error('Poster creation failed')
        }

        const created = await this.findById(createdId)
        if (!created) {
            throw new Error('Poster creation failed')
        }

        return created
    }

    async update(id: string, data: UpdatePosterInput) {
        const existing = await this.findById(id)
        if (!existing) {
            throw new Error('Record to update not found')
        }

        const existingIds = existing.files.map((file) => file.id)

        await this.prisma.$transaction(async (tx) => {
            const nextGalleryId = data.production_ids && data.production_ids.length > 0
                ? await this.ensurePosterGalleryForProductions(tx, data.production_ids)
                : undefined

            await tx.file.updateMany({
                where: { id: { in: existingIds } },
                data: {
                    ...(data.title !== undefined ? { name: data.title } : {}),
                    ...(nextGalleryId !== undefined ? { gallery_id: nextGalleryId } : {}),
                    updated_at: new Date(),
                },
            })
        })

        const updated = await this.findById(id)
        if (!updated) {
            throw new Error('Record to update not found')
        }

        return updated
    }

    async delete(id: string) {
        const poster = await this.findById(id)

        if (!poster) {
            throw new Error('Record to delete does not exist')
        }

        await this.prisma.file.deleteMany({
            where: {
                id: {
                    in: poster.files.map((file) => file.id),
                },
            },
        })

        return poster
    }
}
