import { api } from './client'
import { z } from 'zod'

export const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const locationSchema = z.object({
    id: z.string().uuid(),
    name: localizedTextSchema,
    street: z.string().nullable(),
    number: z.string().nullable(),
    postal_code: z.string().nullable(),
    city: z.string().nullable(),
    country: z.string().nullable(),
})

export type Location = z.infer<typeof locationSchema>

export type CreateLocationInput = {
    name?: {
        nl?: string
        en?: string
        fr?: string
    } | null
    street?: string | null
    number?: string | null
    postal_code?: string | null
    city?: string | null
    country?: string | null
}

export const getLocationById = (locationId: string) =>
    api.get<{ data: Location }>(`/archive/locations/${locationId}`)

export const createLocation = (payload: CreateLocationInput) =>
    api.post<{ data: Location }>(`/archive/locations`, payload)