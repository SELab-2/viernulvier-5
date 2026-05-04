import { api } from './client'
import { z } from 'zod'

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: z.object({ nl: z.string().optional(), en: z.string().optional() }).nullable().optional(),
    content: z.unknown().nullable().optional(),
    createdAt: z.coerce.date().optional(),
})

export type Blog = z.infer<typeof blogSchema>

export const getBlogsByUrl = (url: string) => {
    return api.get<{ data: Blog[] }>(url)
}