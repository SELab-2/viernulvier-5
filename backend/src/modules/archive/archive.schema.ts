import { z } from 'zod'

/**
 * Archive module schemas
 *
 * Replace these with real schemas once the domain model
 * (production, event, genre, etc.) is implemented in Prisma.
 */

export const idParamsSchema = z.object({
    id: z.string().uuid(),
})

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    productionId: z.string().uuid().optional(),
})

// Schema for a single production record
export const productionSchema = z.object({
    id: z.string().uuid(),
    title: z.any().nullable(),
    artist: z.any().nullable(),
    description: z.any().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

// Schema for a paginated list of productions
export const productionListSchema = z.object({
    data: z.array(z.any()), // Use any for array items to fix Swagger media type issue
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type IdParams = z.infer<typeof idParamsSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type ProductionResponse = z.infer<typeof productionSchema>
export type ProductionListResponse = z.infer<typeof productionListSchema>

// Schema for a single event record
export const eventSchema = z.object({
    id: z.string().uuid(),
    starts_at: z.date().nullable(),
    ends_at: z.date().nullable(),
    doors_at: z.date().nullable(),
    production_id: z.string().uuid().nullable(),
    info: z.any().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

// Schema for a paginated list of events
export const eventListSchema = z.object({
    data: z.array(z.any()), // Use any for array items to avoid Swagger issues
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type EventResponse = z.infer<typeof eventSchema>
export type EventListResponse = z.infer<typeof eventListSchema>

// Schema for a single genre record
export const genreSchema = z.object({
    id: z.string().uuid(),
    type: z.string().nullable(),
    name: z.any().nullable(),
    slug: z.any().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

// Schema for a paginated list of genres
export const genreListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

// Schema for a single location record
export const locationSchema = z.object({
    id: z.string().uuid(),
    name: z.any().nullable(),
    city: z.string().nullable(),
    street: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

// Schema for a paginated list of locations
export const locationListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type GenreResponse = z.infer<typeof genreSchema>
export type GenreListResponse = z.infer<typeof genreListSchema>
export type LocationResponse = z.infer<typeof locationSchema>
export type LocationListResponse = z.infer<typeof locationListSchema>

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
