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

export const locationPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

/**
 * Explicit links for the Location resource.
 */
export const locationLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    spaces: z.string().url().optional().default('https://example.com/'),
})

export const locationSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    name: localizedTextSchema,
    code: z.string().nullable(),
    street: z.string().nullable(),
    number: z.string().nullable(),
    postal_code: z.string().nullable(),
    city: z.string().nullable(),
    phone_1: z.string().nullable(),
    phone_2: z.string().nullable(),
    own_location: z.string().nullable(),
    country: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: locationLinksSchema.optional(),
})

export const locationListSchema = createPaginatedResponseSchema(locationSchema)
export const singleLocationSchema = createSingleResponseSchema(locationSchema)

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const updateLocationSchema = z.object({
    apiId: z.string().nullable().optional(),
    name: localizedTextSchema.optional(),
    code: z.string().nullable().optional(),
    street: z.string().nullable().optional(),
    number: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    phone_1: z.string().nullable().optional(),
    phone_2: z.string().nullable().optional(),
    own_location: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
})

export const createLocationSchema = updateLocationSchema

export const errorSchema = z.object({
    message: z.string(),
})

export type LocationPaginationQuery = z.infer<typeof locationPaginationQuerySchema>
export type LocationResponse = z.infer<typeof locationSchema>
export type LocationListResponse = z.infer<typeof locationListSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
export type CreateLocationInput = z.infer<typeof createLocationSchema>
