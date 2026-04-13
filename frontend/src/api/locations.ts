import { api } from './client'
import { z } from 'zod'

export const locationSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    street: z.string().nullable(),
    number: z.string().nullable(),
    postal_code: z.string().nullable(),
    city: z.string().nullable(),
    country: z.string().nullable(),
})

export type Location = z.infer<typeof locationSchema>

export const getLocationById = (locationId: string) =>
    api.get<{ data: Location }>(`/archive/locations/${locationId}`)