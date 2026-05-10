import { api } from './client'
import { z } from 'zod'

export const spaceSchema = z.object({
    id: z.string().uuid(),
    location_id: z.string().uuid().nullable(),
})

export type Space = z.infer<typeof spaceSchema>

export const getSpaceById = (spaceId: string) =>
    api.get<{ data: Space }>(`/archive/spaces/${spaceId}`)