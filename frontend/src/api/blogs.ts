import { api } from './client'

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
