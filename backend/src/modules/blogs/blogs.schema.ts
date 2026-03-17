import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema 
} from '../../utils/rest-schemas.js'

export const blogPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

/**
 * Explicit links for the Blog resource.
 */
export const blogLinksSchema = z.object({
    self: z.string().url(),
})

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    content: z.string().min(1),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    links: blogLinksSchema.optional(),
})

export const blogListSchema = createPaginatedResponseSchema(blogSchema)
export const singleBlogSchema = createSingleResponseSchema(blogSchema)

export const createBlogSchema = blogSchema.omit({ id: true, createdAt: true, updatedAt: true, links: true })
export const updateBlogSchema = createBlogSchema.partial()

export const blogIdSchema = z.object({
    id: z.string().uuid(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export type BlogPaginationQuery = z.infer<typeof blogPaginationQuerySchema>
export type BlogResponse = z.infer<typeof blogSchema>
export type BlogListResponse = z.infer<typeof blogListSchema>
export type CreateBlogInput = z.infer<typeof createBlogSchema>
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>
