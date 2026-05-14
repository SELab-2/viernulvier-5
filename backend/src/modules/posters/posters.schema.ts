import { z } from 'zod'
import { createPaginatedResponseSchema, createSingleResponseSchema } from '../../utils/rest-schemas.js'

export const posterPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    productionId: z.string().uuid().optional(),
    yearFrom: z.coerce.number().int().optional(),
    yearTo: z.coerce.number().int().optional(),
    sort: z.enum(['recent', 'oldest']).optional().default('recent'),
    lang: z.string().optional().default('nl'),
})

export const posterLanguageQuerySchema = z.object({
    lang: z.string().optional().default('nl'),
})

export const posterLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    file: z.string().url().default('https://example.com/'),
    production: z.string().url().optional().nullable().default('https://example.com/'),
})

export const posterAssetSchema = z.object({
    id: z.string().uuid(),
    file_url: z.string().url(),
    mime_type: z.string().nullable(),
    original_filename: z.string().nullable(),
    file_size_bytes: z.number().int().nullable(),
})

export const posterProductionSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
})

export const posterSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    file_url: z.string().url(),
    mime_type: z.string().nullable(),
    original_filename: z.string().nullable(),
    file_size_bytes: z.number().int().nullable(),
    files: z.array(posterAssetSchema),
    production: posterProductionSchema.nullable(),
    productions: z.array(posterProductionSchema),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: posterLinksSchema.optional(),
})

export const posterListSchema = createPaginatedResponseSchema(posterSchema)
export const singlePosterSchema = createSingleResponseSchema(posterSchema)

export const posterIdParamSchema = z.object({
    id: z.string().uuid(),
})

export const updatePosterSchema = z.object({
    title: z.string().min(1).optional(),
    production_ids: z.array(z.string().uuid()).optional(),
})

const createPosterFileSchema = z.object({
    file_name: z.string().min(1),
    mime_type: z.string().min(1),
    file_base64: z.string().min(1),
})

export const createPosterSchema = z.object({
    title: z.string().min(1),
    production_ids: z.array(z.string().uuid()).default([]),
    files: z.array(createPosterFileSchema).min(1),
})

export const errorSchema = z.object({
    message: z.string(),
})

export type PosterPaginationQuery = z.infer<typeof posterPaginationQuerySchema>
export type PosterResponse = z.infer<typeof posterSchema>
export type UpdatePosterInput = z.infer<typeof updatePosterSchema>
export type CreatePosterInput = z.infer<typeof createPosterSchema>
export type CreatePosterPersistenceInput = {
    title: string
    files: Array<{
        file_path: string
        mime_type?: string | null
        original_filename?: string | null
        file_size_bytes?: number | null
    }>
    production_ids: string[]
}
