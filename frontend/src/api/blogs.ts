import { api } from './client'
import { z } from 'zod'

export type BlogListItem = {
    id: string
    title?: unknown
    content?: unknown
    productions: string[]
    createdAt: string
    updatedAt: string
    links?: { self: string }
}

type PaginatedResponse<T> = {
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

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

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: z.object({ nl: z.string().optional(), en: z.string().optional() }).nullable().optional(),
    content: z.unknown().nullable().optional(),
    createdAt: z.coerce.date().optional(),
})

export type Blog = z.infer<typeof blogSchema>

export const getBlogsByProductionId = (productionId: string) => {
    return api.get<{ data: Blog[] }>(`/archive/blogs?productionId=${productionId}`)
}
