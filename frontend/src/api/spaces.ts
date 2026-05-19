import { api } from './client'
import { z } from 'zod'

export const spaceSchema = z.object({
    id: z.string().uuid(),
    location_id: z.string().uuid().nullable(),
})

export type Space = z.infer<typeof spaceSchema>

export type CreateSpaceInput = {
    name?: {
        nl?: string
        en?: string
        fr?: string
    } | null
    location_id?: string | null
}

export const getSpaceById = (spaceId: string) =>
    api.get<{ data: Space }>(`/archive/spaces/${spaceId}`)

export const createSpace = (payload: CreateSpaceInput) =>
    api.post<{ data: Space }>(`/archive/spaces`, payload)