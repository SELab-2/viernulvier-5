import { z } from 'zod'

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    content: z.string().min(1),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
})

export const createBlogSchema = blogSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateBlogSchema = createBlogSchema.partial()

export const blogIdSchema = z.object({
    id: z.string().uuid(),
})

export type Blog = z.infer<typeof blogSchema>
export type CreateBlogInput = z.infer<typeof createBlogSchema>
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>
