import { z } from 'zod'

const localizedTextSchema = z.record(z.string())

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export const genreSchema = z.object({
    id: z.string().uuid(),
    type: z.string().nullable(),
    name: localizedTextSchema.nullable(),
    slug: localizedTextSchema.nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const genreListSchema = z.object({
    data: z.array(genreSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const createGenreSchema = z.object({
    type: z.string().nullable().optional(),
    name: localizedTextSchema.nullable().optional(),
    slug: localizedTextSchema.nullable().optional(),
})

export const updateGenreSchema = z.object({
    type: z.string().nullable().optional(),
    name: localizedTextSchema.nullable().optional(),
    slug: localizedTextSchema.nullable().optional(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type GenreResponse = z.infer<typeof genreSchema>
export type GenreListResponse = z.infer<typeof genreListSchema>
export type CreateGenreInput = z.infer<typeof createGenreSchema>
export type UpdateGenreInput = z.infer<typeof updateGenreSchema>

// Schema for a single tag record
export const tagSchema = z.object({
    id: z.string().uuid(),
    code: z.string().nullable(),
    name: localizedTextSchema.nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

// Schema for a paginated list of tags
export const tagListSchema = z.object({
    data: z.array(tagSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const createTagSchema = z.object({
    code: z.string().nullable().optional(),
    name: localizedTextSchema.nullable().optional(),
})

export const updateTagSchema = z.object({
    code: z.string().nullable().optional(),
    name: localizedTextSchema.nullable().optional(),
})

export type TagResponse = z.infer<typeof tagSchema>
export type TagListResponse = z.infer<typeof tagListSchema>
export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
