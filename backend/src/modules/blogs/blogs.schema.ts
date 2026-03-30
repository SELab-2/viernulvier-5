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
    self: z.string().url().default('https://example.com/'),
})

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: z.string().nullable().optional(),
    content: z.unknown().nullable().optional(),
    productions: z.array(z.string().uuid()),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    links: blogLinksSchema.optional(),
})

export const blogListSchema = createPaginatedResponseSchema(blogSchema)
export const singleBlogSchema = createSingleResponseSchema(blogSchema)

export const createBlogSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.unknown().optional(),
    productionIds: z.array(z.string().uuid()).min(1),
})

export const updateBlogSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.unknown().optional(),
    productionIds: z.array(z.string().uuid()).min(1).optional(),
})

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
