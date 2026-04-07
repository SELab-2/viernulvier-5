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

export const spacePaginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    locationId: z.string().uuid().optional(),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

/**
 * Explicit links for the Space resource.
 */
export const spaceLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    location: z.string().url().optional().default('https://example.com/'),
    halls: z.string().url().optional().default('https://example.com/'),
})

export const spaceSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    vendor_id: z.string().nullable(),
    name: localizedTextSchema,
    location_id: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: spaceLinksSchema.optional(),
})

export const spaceListSchema = createPaginatedResponseSchema(spaceSchema)
export const singleSpaceSchema = createSingleResponseSchema(spaceSchema)

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const createSpaceSchema = z.object({
    apiId: z.string().nullable().optional(),
    vendor_id: z.string().nullable().optional(),
    name: localizedTextSchema.optional(),
    location_id: z.string().uuid().nullable().optional(),
})

export const updateSpaceSchema = createSpaceSchema.partial()

export const errorSchema = z.object({
    message: z.string(),
})

export type SpacePaginationQuery = z.infer<typeof spacePaginationQuerySchema>
export type SpaceResponse = z.infer<typeof spaceSchema>
export type SpaceListResponse = z.infer<typeof spaceListSchema>
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>
