import { api } from './client'
import { z } from 'zod'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const genreSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    type: z.string().nullable(),
    vendor_id: z.string().nullable(),
    name: localizedTextSchema,
    slug: localizedTextSchema,
    description: localizedTextSchema,
})

export type Genre = z.infer<typeof genreSchema>

export const getGenresByProductionId = (productionId: string) =>
    api.get<{ data: Genre[] }>(`/archive/genres?productionId=${productionId}`)