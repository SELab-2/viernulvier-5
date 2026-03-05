import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

export const genreSchema = z.object({
    id: z.string().uuid(),
    type: z.string().nullable(),
    name: z.any().nullable(),
    slug: z.any().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const genreListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type GenreResponse = z.infer<typeof genreSchema>
export type GenreListResponse = z.infer<typeof genreListSchema>

// Schema for a single tag record
export const tagSchema = z.object({
    id: z.string().uuid(),
    code: z.string().nullable(),
    name: z.any().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

// Schema for a paginated list of tags
export const tagListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type TagResponse = z.infer<typeof tagSchema>
export type TagListResponse = z.infer<typeof tagListSchema>
