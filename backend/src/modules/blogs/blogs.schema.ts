import { z } from 'zod'

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    content: z.string().min(1),
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})

export const createBlogSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    publishedAt: z.string().datetime().optional(),
})

export const updateBlogSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    publishedAt: z.string().datetime().optional().nullable(),
})

export const blogParamsSchema = z.object({
    id: z.string().uuid(),
})

export const blogListSchema = z.array(blogSchema)

export const errorSchema = z.object({
    message: z.string(),
    error: z.string().optional(),
    statusCode: z.number(),
})

export type Blog = z.infer<typeof blogSchema>
export type CreateBlog = z.infer<typeof createBlogSchema>
export type UpdateBlog = z.infer<typeof updateBlogSchema>
