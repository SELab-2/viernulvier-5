import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema,
    paginationQuerySchema
} from '../../utils/rest-schemas.js'

export const localizedBlogTitleSchema = z.object({
    nl: z.string().nullable().optional(),
    en: z.string().nullable().optional(),
}).strict()

export const blogTitleSchema = z.union([
    localizedBlogTitleSchema,
    z.string().min(1),
])

export const blogPaginationQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional(),
    yearFrom: z.coerce.number().int().optional(),
    yearTo: z.coerce.number().int().optional(),
    productionId: z.string().uuid().optional(),
    draft: z.enum(['true', 'false'])
        .optional()
        .transform((val) => (val ? val === 'true' : undefined)),
})

/**
 * Explicit links for the Blog resource.
 */
export const blogLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
})

export const blogSchema = z.object({
    id: z.string().uuid(),
    draft: z.boolean().nullable().optional(),
    title: blogTitleSchema.nullable().optional(),
    content: z.unknown().nullable().optional(),
    productions: z.array(z.string().uuid()),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    links: blogLinksSchema.optional(),
})

export const blogListSchema = createPaginatedResponseSchema(blogSchema)
export const singleBlogSchema = createSingleResponseSchema(blogSchema)

export const createBlogSchema = z.object({
    draft: z.boolean().nullable().optional(),
    title: blogTitleSchema.optional(),
    content: z.unknown().optional(),
    productionIds: z.array(z.string().uuid()),
})

export const updateBlogSchema = z.object({
    draft: z.boolean().nullable().optional(),
    title: blogTitleSchema.optional(),
    content: z.unknown().optional(),
    productionIds: z.array(z.string().uuid()).optional(),
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
export type LocalizedBlogTitle = z.infer<typeof localizedBlogTitleSchema>
