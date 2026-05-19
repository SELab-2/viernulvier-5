import { api } from './client'
import { z } from 'zod'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const hallSchema = z.object({
    id: z.string().uuid(),
    name: localizedTextSchema,
    space_id: z.string().uuid().nullable(),
})

export type Hall = z.infer<typeof hallSchema>

export type CreateHallInput = {
    name?: {
        nl?: string
        en?: string
        fr?: string
    } | null
    space_id?: string | null
}

export const getHallById = (hallId: string) =>
    api.get<{ data: Hall }>(`/archive/halls/${hallId}`)

export const createHall = (payload: CreateHallInput) =>
    api.post<{ data: Hall }>(`/archive/halls`, payload)