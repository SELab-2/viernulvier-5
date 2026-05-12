import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema,
    paginationQuerySchema
} from '../../utils/rest-schemas.js'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const genrePaginationQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
    productionId: z.string().optional(),
})
export const tagPaginationQuerySchema = genrePaginationQuerySchema

/**
 * Explicit links for the Genre resource.
 */
export const genreLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    productions: z.string().url().optional().nullable().default('https://example.com/'),
})

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
    links: genreLinksSchema.optional(),
})

export const genreListSchema = createPaginatedResponseSchema(genreSchema)
export const singleGenreSchema = createSingleResponseSchema(genreSchema)

/**
 * Explicit links for the Tag resource.
 */
export const tagLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    productions: z.string().url().optional().nullable().default('https://example.com/'),
})

// basically the same as a genreSchema now, should it be changed it so it uses the same one?
export const tagSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    type: z.string().nullable(),
    vendor_id: z.string().nullable(),
    name: localizedTextSchema,
    slug: localizedTextSchema,
    description: localizedTextSchema,
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
    vendor_id: z.string().nullable().optional(),
    name: localizedTextSchema.optional(),
    slug: localizedTextSchema.optional(),
    description: localizedTextSchema.optional(),
})

export const updateGenreSchema = createGenreSchema.partial()

export const createTagSchema = z.object({
    apiId: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    vendor_id: z.string().nullable().optional(),
    name: localizedTextSchema.optional(),
    slug: localizedTextSchema.optional(),
    description: localizedTextSchema.optional(),
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
