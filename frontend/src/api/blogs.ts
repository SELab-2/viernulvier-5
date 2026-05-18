import { api } from './client'
import { z } from 'zod'

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

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: z.object({
        nl: z.string().nullable().optional(),
        en: z.string().nullable().optional(),
    }).nullable().optional(),
    content: z.record(z.string(), z.unknown()).nullable().optional(),
    productions: z.array(z.string().uuid()),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: z.object({
        self: z.string(),
    }).optional(),
})

export type Blog = z.infer<typeof blogSchema>

export const getBlogsByProductionId = async (productionId: string) => {
    const first = await api.get<PaginatedResponse<Blog>>(`/archive/blogs?productionId=${productionId}&page=1`)
    const { totalPages } = first.meta

    if (totalPages <= 1) return { data: first.data }

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            api.get<PaginatedResponse<Blog>>(`/archive/blogs?productionId=${productionId}&page=${i + 2}`)
        )
    )

    return { data: [...first.data, ...rest.flatMap((r) => r.data)] }
}