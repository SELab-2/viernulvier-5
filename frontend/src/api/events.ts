import { api } from './client'
import { z } from 'zod'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const eventSchema = z.object({
    id: z.string().uuid(),
    starts_at: z.coerce.date().nullable(),
    ends_at: z.coerce.date().nullable(),
    doors_at: z.coerce.date().nullable(),
    info: localizedTextSchema,
    production_id: z.string().uuid().nullable(),
    hall_id: z.string().uuid().nullable(),
})

export type Event = z.infer<typeof eventSchema>

export const getEventsByProductionId = (productionId: string) =>
    api.get<{ data: Event[] }>(`/archive/events?production_id=${productionId}`)