import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema 
} from '../../utils/rest-schemas.js'

export const uitdatabankPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

/**
 * Explicit links for the Keyword resource.
 */
export const keywordLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    productions: z.string().url().optional().nullable().default('https://example.com/'),
})

export const keywordSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: keywordLinksSchema.optional(),
})

/**
 * Explicit links for the Theme resource.
 */
export const themeLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    productions: z.string().url().optional().nullable().default('https://example.com/'),
})

export const themeSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    name: z.string().nullable(),
    cdb_cat_id: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: themeLinksSchema.optional(),
})

/**
 * Explicit links for the Type resource.
 */
export const typeLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    productions: z.string().url().optional().nullable().default('https://example.com/'),
})

export const typeSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    name: z.string().nullable(),
    cdb_cat_id: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: typeLinksSchema.optional(),
})

export const keywordListSchema = createPaginatedResponseSchema(keywordSchema)
export const singleKeywordSchema = createSingleResponseSchema(keywordSchema)

export const themeListSchema = createPaginatedResponseSchema(themeSchema)
export const singleThemeSchema = createSingleResponseSchema(themeSchema)

export const typeListSchema = createPaginatedResponseSchema(typeSchema)
export const singleTypeSchema = createSingleResponseSchema(typeSchema)

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export type UitdatabankPaginationQuery = z.infer<typeof uitdatabankPaginationQuerySchema>
export type KeywordResponse = z.infer<typeof keywordSchema>
export type ThemeResponse = z.infer<typeof themeSchema>
export type TypeResponse = z.infer<typeof typeSchema>
