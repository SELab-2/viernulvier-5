import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema 
} from '../../utils/rest-schemas.js'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const genrePaginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

export const tagPaginationQuerySchema = genrePaginationQuerySchema

/**
 * Explicit links for the Genre resource.
 */
export const genreLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    productions: z.string().url().optional().default('https://example.com/'),
})

export const genreSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    type: z.string().nullable(),
    use_as: z.string().nullable(),
    vendor_id: z.string().nullable(),
    name: localizedTextSchema,
    slug: localizedTextSchema,
    description: localizedTextSchema,
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: genreLinksSchema.optional(),
})

export const genreListSchema = createPaginatedResponseSchema(genreSchema)
export const singleGenreSchema = createSingleResponseSchema(genreSchema)

/**
 * Explicit links for the Tag resource.
 */
export const tagLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    gallery: z.string().url().optional().default('https://example.com/'),
})

export const tagSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    source: z.string().nullable(),
    sourcetype: z.string().nullable(),
    enable: z.string().nullable(),
    code: z.string().nullable(),
    name: localizedTextSchema,
    short_description: localizedTextSchema,
    url: z.string().nullable(),
    url_title: localizedTextSchema,
    expires_after: z.number().int().nullable(),
    automatically_assigned: z.boolean().nullable(),
    external: z.boolean().nullable(),
    gallery_id: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: tagLinksSchema.optional(),
})

export const tagListSchema = createPaginatedResponseSchema(tagSchema)
export const singleTagSchema = createSingleResponseSchema(tagSchema)

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const createGenreSchema = z.object({
    apiId: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    use_as: z.string().nullable().optional(),
    vendor_id: z.string().nullable().optional(),
    name: localizedTextSchema.optional(),
    slug: localizedTextSchema.optional(),
    description: localizedTextSchema.optional(),
})

export const updateGenreSchema = createGenreSchema.partial()

export const createTagSchema = z.object({
    apiId: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    sourcetype: z.string().nullable().optional(),
    enable: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    name: localizedTextSchema.optional(),
    short_description: localizedTextSchema.optional(),
    url: z.string().nullable().optional(),
    url_title: localizedTextSchema.optional(),
    expires_after: z.number().int().nullable().optional(),
    automatically_assigned: z.boolean().nullable().optional(),
    external: z.boolean().nullable().optional(),
    gallery_id: z.string().uuid().nullable().optional(),
})

export const updateTagSchema = createTagSchema.partial()

export const errorSchema = z.object({
    message: z.string(),
})

export type GenrePaginationQuery = z.infer<typeof genrePaginationQuerySchema>
export type TagPaginationQuery = z.infer<typeof tagPaginationQuerySchema>
export type GenreResponse = z.infer<typeof genreSchema>
export type GenreListResponse = z.infer<typeof genreListSchema>
export type TagResponse = z.infer<typeof tagSchema>
export type TagListResponse = z.infer<typeof tagListSchema>
export type CreateGenreInput = z.infer<typeof createGenreSchema>
export type UpdateGenreInput = z.infer<typeof updateGenreSchema>
export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
