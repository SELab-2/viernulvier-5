import crypto from 'node:crypto'
import { Prisma, type PrismaClient } from '@prisma/client'

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

    private readonly selectPosterSql = Prisma.sql`
        SELECT
            p.created_at,
            p.updated_at,
            p.id,
            p.title,
            p.file_path,
            p.mime_type,
            p.original_filename,
            p.file_size_bytes,
            p.production_id,
            CASE
                WHEN prod.id IS NULL THEN NULL
                ELSE json_build_object('id', prod.id, 'title', prod.title)
            END AS production
        FROM poster p
        LEFT JOIN production prod ON prod.id = p.production_id
    `

    async findAll(options: FindAllOptions) {
        const { page, limit, search, sort = 'recent' } = options
        const skip = (page - 1) * limit
        const whereClause = search
            ? Prisma.sql`WHERE p.title ILIKE ${`%${search}%`}`
            : Prisma.empty
        const orderDirection = sort === 'oldest' ? Prisma.raw('ASC') : Prisma.raw('DESC')

        return this.prisma.$queryRaw<PosterRecord[]>(Prisma.sql`
            ${this.selectPosterSql}
            ${whereClause}
            ORDER BY p.created_at ${orderDirection}
            OFFSET ${skip}
            LIMIT ${limit}
        `)
    }

    async count(options: Pick<FindAllOptions, 'search'>) {
        const whereClause = options.search
            ? Prisma.sql`WHERE title ILIKE ${`%${options.search}%`}`
            : Prisma.empty
        const result = await this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
            SELECT COUNT(*)::int AS count
            FROM poster
            ${whereClause}
        `)

        return result[0]?.count ?? 0
    }

    async findById(id: string) {
        const rows = await this.prisma.$queryRaw<PosterRecord[]>(Prisma.sql`
            ${this.selectPosterSql}
            WHERE p.id = ${id}
            LIMIT 1
        `)

        return rows[0] ?? null
    }

    async create(data: CreatePosterInput) {
        const id = crypto.randomUUID()

        const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            INSERT INTO poster (
                id,
                title,
                file_path,
                mime_type,
                original_filename,
                file_size_bytes,
                production_id
            )
            VALUES (
                ${id},
                ${data.title},
                ${data.file_path},
                ${data.mime_type ?? null},
                ${data.original_filename ?? null},
                ${data.file_size_bytes ?? null},
                ${data.production_id}
            )
            RETURNING id
        `)

        return this.findById(rows[0].id)
    }

    async update(id: string, data: UpdatePosterInput) {
        const updates: Prisma.Sql[] = []

        if (data.title !== undefined) {
            updates.push(Prisma.sql`title = ${data.title}`)
        }

        if (data.production_id !== undefined) {
            updates.push(Prisma.sql`production_id = ${data.production_id}`)
        }

        updates.push(Prisma.sql`updated_at = CURRENT_TIMESTAMP`)

        const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            UPDATE poster
            SET ${Prisma.join(updates, ', ')}
            WHERE id = ${id}
            RETURNING id
        `)

        if (rows.length === 0) {
            throw new Error('Record to update not found')
        }

        return this.findById(rows[0].id)
    }

    async delete(id: string) {
        const poster = await this.findById(id)

        if (!poster) {
            throw new Error('Record to delete does not exist')
        }

        await this.prisma.$executeRaw(Prisma.sql`
            DELETE FROM poster
            WHERE id = ${id}
        `)

        return poster
    }
}
