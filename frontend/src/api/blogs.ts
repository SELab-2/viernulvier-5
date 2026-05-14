import { api } from './client'
import { z } from 'zod'

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: z.object({ nl: z.string().optional(), en: z.string().optional() }).nullable().optional(),
    content: z.unknown().nullable().optional(),
    created_at: z.coerce.date().optional(),
})

export type Blog = z.infer<typeof blogSchema>

export const getBlogsByProductionId = (productionId: string) => {
    return api.get<{ data: Blog[] }>(`/archive/blogs?productionId=${productionId}`)
}