import { z } from 'zod'

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

export const keywordSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const keywordListSchema = z.object({
    data: z.array(keywordSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const themeSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    cdb_cat_id: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const themeListSchema = z.object({
    data: z.array(themeSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const typeSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    cdb_cat_id: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const typeListSchema = z.object({
    data: z.array(typeSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type KeywordResponse = z.infer<typeof keywordSchema>
export type KeywordListResponse = z.infer<typeof keywordListSchema>
export type ThemeResponse = z.infer<typeof themeSchema>
export type ThemeListResponse = z.infer<typeof themeListSchema>
export type TypeResponse = z.infer<typeof typeSchema>
export type TypeListResponse = z.infer<typeof typeListSchema>
