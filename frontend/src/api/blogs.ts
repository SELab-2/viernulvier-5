import { api } from './client'
import { z } from 'zod'

export type BlogListItem = z.infer<typeof blogSchema>
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
    title: z
        .object({
            nl: z.string().nullable().optional(),
            en: z.string().nullable().optional(),
            fr: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
    content: z.record(z.string(), z.unknown()).nullable().optional(),
    images: z.array(z.string()).optional(),
    thumbnail_index: z.number().int().nonnegative().optional(),
    productions: z.array(z.string()).optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    links: z
        .object({
            self: z.string(),
        })
        .optional(),
})

export type Blog = z.infer<typeof blogSchema>

export const getLatestBlog = (locale: 'nl' | 'en') => {
    const params = new URLSearchParams({
        page: '1',
        limit: '1',
        lang: locale,
    })

    return api.get<PaginatedResponse<BlogListItem>>(`/archive/blogs?${params.toString()}`)
}

export const getBlogById = (id: string) => {
    return api.get<{ data: BlogListItem }>(`/archive/blogs/${id}`)
}

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
