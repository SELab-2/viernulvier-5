import { z } from 'zod'

const localizedTextSchema = z.record(z.string())

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export const locationSchema = z.object({
    id: z.string().uuid(),
    name: localizedTextSchema.nullable(),
    city: z.string().nullable(),
    street: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const locationListSchema = z.object({
    data: z.array(locationSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const createLocationSchema = z.object({
    name: localizedTextSchema.nullable().optional(),
    code: z.string().nullable().optional(),
    street: z.string().nullable().optional(),
    number: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
})

export const updateLocationSchema = z.object({
    name: localizedTextSchema.nullable().optional(),
    code: z.string().nullable().optional(),
    street: z.string().nullable().optional(),
    number: z.string().nullable().optional(),
    postal_code: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type LocationResponse = z.infer<typeof locationSchema>
export type LocationListResponse = z.infer<typeof locationListSchema>
export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>

// Schema for a single hall record
export const hallSchema = z.object({
    id: z.string().uuid(),
    name: localizedTextSchema.nullable(),
    space_id: z.string().uuid().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

// Schema for a paginated list of halls
export const hallListSchema = z.object({
    data: z.array(hallSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

// Schema for a single space record
export const spaceSchema = z.object({
    id: z.string().uuid(),
    name: localizedTextSchema.nullable(),
    location_id: z.string().uuid().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

// Schema for a paginated list of spaces
export const spaceListSchema = z.object({
    data: z.array(spaceSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type HallResponse = z.infer<typeof hallSchema>
export type HallListResponse = z.infer<typeof hallListSchema>
export type SpaceResponse = z.infer<typeof spaceSchema>
export type SpaceListResponse = z.infer<typeof spaceListSchema>
