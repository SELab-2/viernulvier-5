import { api } from './client'
import { z } from 'zod'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const tagSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    type: z.string().nullable(),
    vendor_id: z.string().nullable(),
    name: localizedTextSchema,
    slug: localizedTextSchema,
    description: localizedTextSchema,
})

export type Tag = z.infer<typeof tagSchema>

export const getTagsByProductionId = (productionId: string) =>
    api.get<{ data: Tag[] }>(`/archive/tags?productionId=${productionId}`)