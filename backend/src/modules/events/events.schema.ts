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

export const eventPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    productionId: z.string().uuid().optional(),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

export const eventPricePaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    eventId: z.string().uuid().optional(),
    search: z.string().optional(),
})

/**
 * Explicit links for the Event resource.
 */
export const eventLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    production: z.string().url().optional().nullable().default('https://example.com/'),
    hall: z.string().url().optional().nullable().default('https://example.com/'),
    prices: z.string().url().optional().nullable().default('https://example.com/'),
})

export const eventSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    starts_at: z.coerce.date().nullable(),
    ends_at: z.coerce.date().nullable(),
    intermission_at: z.coerce.date().nullable(),
    doors_at: z.coerce.date().nullable(),
    box_office_id: z.string().nullable(),
    vendor_id: z.string().nullable(),
    max_tickets_per_order: z.number().int().nullable(),
    uitdatabank_id: z.string().nullable(),
    secure: z.boolean().nullable(),
    sms_verification: z.boolean().nullable(),
    info: localizedTextSchema,
    eticket_info: localizedTextSchema,
    external_order_url: localizedTextSchema,
    order_url: z.string().nullable(),
    production_id: z.string().uuid().nullable(),
    status_id: z.string().uuid().nullable(),
    hall_id: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: eventLinksSchema.optional(),
})

export const eventListSchema = createPaginatedResponseSchema(eventSchema)
export const singleEventSchema = createSingleResponseSchema(eventSchema)

/**
 * Explicit links for the EventPrice resource.
 */
export const eventPriceLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    event: z.string().url().optional().nullable().default('https://example.com/'),
})

export const eventPriceSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    event_id: z.string().uuid().nullable(),
    available: z.number().int().nullable(),
    amount: z.string().nullable(),
    box_office_id: z.string().nullable(),
    contigent_id: z.number().int().nullable(),
    expires_at: z.coerce.date().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: eventPriceLinksSchema.optional(),
})

export const eventPriceListSchema = createPaginatedResponseSchema(eventPriceSchema)
export const singleEventPriceSchema = createSingleResponseSchema(eventPriceSchema)

export const updateEventSchema = z.object({
    apiId: z.string().nullable().optional(),
    starts_at: z.coerce.date().nullable().optional(),
    ends_at: z.coerce.date().nullable().optional(),
    intermission_at: z.coerce.date().nullable().optional(),
    doors_at: z.coerce.date().nullable().optional(),
    box_office_id: z.string().nullable().optional(),
    vendor_id: z.string().nullable().optional(),
    max_tickets_per_order: z.number().int().nullable().optional(),
    uitdatabank_id: z.string().nullable().optional(),
    secure: z.boolean().nullable().optional(),
    sms_verification: z.boolean().nullable().optional(),
    info: localizedTextSchema.optional(),
    eticket_info: localizedTextSchema.optional(),
    external_order_url: localizedTextSchema.optional(),
    order_url: z.string().nullable().optional(),
    production_id: z.string().uuid().nullable().optional(),
    status_id: z.string().uuid().nullable().optional(),
    hall_id: z.string().uuid().nullable().optional(),
})

export const updateEventParamsSchema = z.object({
    id: z.string().uuid(),
})

export const createEventSchema = updateEventSchema

export const errorSchema = z.object({
    message: z.string(),
})

export type EventPaginationQuery = z.infer<typeof eventPaginationQuerySchema>
export type EventPricePaginationQuery = z.infer<typeof eventPricePaginationQuerySchema>
export type EventResponse = z.infer<typeof eventSchema>
export type EventListResponse = z.infer<typeof eventListSchema>
export type EventPriceResponse = z.infer<typeof eventPriceSchema>
export type EventPriceListResponse = z.infer<typeof eventPriceListSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type CreateEventInput = z.infer<typeof createEventSchema>
