import { z } from 'zod'

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[]

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.array(jsonValueSchema),
        z.record(jsonValueSchema),
    ])
)

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
    info: jsonValueSchema.nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const eventListSchema = z.object({
    data: z.array(eventSchema),
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
    data: z.array(eventPriceSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const updateEventSchema = z.object({
    starts_at: z.coerce.date().optional(),
    ends_at: z.coerce.date().optional(),
    doors_at: z.coerce.date().optional(),
    production_id: z.string().uuid().optional(),
    info: jsonValueSchema.optional(),
})

export const updateEventParamsSchema = z.object({
    id: z.string().uuid(),
})

export const createEventSchema = z.object({
    starts_at: z.coerce.date().nullable().optional(),
    ends_at: z.coerce.date().nullable().optional(),
    doors_at: z.coerce.date().nullable().optional(),
    production_id: z.string().uuid().nullable().optional(),
    info: jsonValueSchema.nullable().optional(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type EventResponse = z.infer<typeof eventSchema>
export type EventListResponse = z.infer<typeof eventListSchema>
export type EventPriceResponse = z.infer<typeof eventPriceSchema>
export type EventPriceListResponse = z.infer<typeof eventPriceListSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
