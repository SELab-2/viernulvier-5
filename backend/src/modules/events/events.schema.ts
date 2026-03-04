import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    productionId: z.string().uuid().optional(),
    search: z.string().optional(),
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

export const eventPriceSchema = z.object({
    id: z.string().uuid(),
    event_id: z.string().uuid().nullable(),
    amount: z.string().nullable(),
    available: z.number().int().nullable(),
    price_id: z.string().uuid().nullable(),
    rank_id: z.string().uuid().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const eventPriceListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const eventStatusSchema = z.object({
    id: z.string().uuid(),
    name: z.any().nullable(),
    short_name: z.string().nullable(),
    fixed: z.boolean().nullable(),
    visible: z.boolean().nullable(),
    bookable: z.boolean().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const eventStatusListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const eventExtraListSchema = z.object({
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
export type EventPriceResponse = z.infer<typeof eventPriceSchema>
export type EventPriceListResponse = z.infer<typeof eventPriceListSchema>
export type EventStatusResponse = z.infer<typeof eventStatusSchema>
export type EventStatusListResponse = z.infer<typeof eventStatusListSchema>
export type EventExtraListResponse = z.infer<typeof eventExtraListSchema>
