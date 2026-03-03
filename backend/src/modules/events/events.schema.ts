import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    productionId: z.string().uuid().optional(),
})

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

export const eventListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type EventResponse = z.infer<typeof eventSchema>
export type EventListResponse = z.infer<typeof eventListSchema>
