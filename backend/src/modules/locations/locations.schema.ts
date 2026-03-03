import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

export const locationSchema = z.object({
    id: z.string().uuid(),
    name: z.any().nullable(),
    city: z.string().nullable(),
    street: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const locationListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type LocationResponse = z.infer<typeof locationSchema>
export type LocationListResponse = z.infer<typeof locationListSchema>
