import { api } from './client'
import { z } from 'zod'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

type Meta = {
    total: number
    page: number
    limit: number
    totalPages: number
}

type PaginatedResponse<T> = {
    data: T[]
    meta: Meta
}

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
    links: z.object({
        self: z.string(),
        production: z.string().nullable().optional(),
        hall: z.string().nullable().optional(),
        prices: z.string().nullable().optional(),
    }).optional(),
})

export type Event = z.infer<typeof eventSchema>

export const getEventsByProductionId = async (productionId: string) => {
    const first = await api.get<PaginatedResponse<Event>>(`/archive/events?productionId=${productionId}&page=1`)
    const { totalPages } = first.meta

    if (totalPages <= 1) return { data: first.data }

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            api.get<PaginatedResponse<Event>>(`/archive/events?productionId=${productionId}&page=${i + 2}`)
        )
    )

    return { data: [...first.data, ...rest.flatMap((r) => r.data)] }
}