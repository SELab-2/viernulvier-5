import { api } from './client'
import { z } from 'zod'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

type Meta = {
    total: number
    page: number
    limit: number
    totalPages: number
}

type PaginatedResponse<T> = {
    data: T[]
    meta: Meta
}

export const genreSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    type: z.string().nullable(),
    vendor_id: z.string().nullable(),
    name: localizedTextSchema,
    slug: localizedTextSchema,
    description: localizedTextSchema,
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: z.object({
        self: z.string(),
        productions: z.string().nullable().optional(),
        hall: z.string().nullable().optional(),
        prices: z.string().nullable().optional(),
    }).optional(),
})

export type Genre = z.infer<typeof genreSchema>

export const getGenresByProductionId = async (productionId: string) => {
    const first = await api.get<PaginatedResponse<Genre>>(`/archive/genres?productionId=${productionId}&page=1`)
    const { totalPages } = first.meta

    if (totalPages <= 1) return { data: first.data }

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            api.get<PaginatedResponse<Genre>>(`/archive/genres?productionId=${productionId}&page=${i + 2}`)
        )
    )

    return { data: [...first.data, ...rest.flatMap((r) => r.data)] }
}