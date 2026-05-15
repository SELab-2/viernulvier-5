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
})

/**
 * Explicit links for the Blog resource.
 */
export const blogLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
})

export const blogSchema = z.object({
    id: z.string().uuid(),
    title: blogTitleSchema.nullable().optional(),
    content: z.unknown().nullable().optional(),
    thumbnail_index: z.number().int().nonnegative().nullable().optional(),
    images: z.array(z.string()).optional(),
    productions: z.array(z.string().uuid()),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    links: blogLinksSchema.optional(),
})

export const blogListSchema = createPaginatedResponseSchema(blogSchema)
export const singleBlogSchema = createSingleResponseSchema(blogSchema)

export const createBlogSchema = z.object({
    title: blogTitleSchema.optional(),
    content: z.unknown().optional(),
    thumbnail_index: z.number().int().nonnegative().nullable().optional(),
    images: z.array(z.string()).optional(),
    productionIds: z.array(z.string().uuid()),
})

export const updateBlogSchema = z.object({
    title: blogTitleSchema.optional(),
    content: z.unknown().optional(),
    thumbnail_index: z.number().int().nonnegative().nullable().optional(),
    images: z.array(z.string()).optional(),
    productionIds: z.array(z.string().uuid()).optional(),
})

export const blogIdSchema = z.object({
    id: z.string().uuid(),
})

export const blogImageDeleteParamsSchema = z.object({
    id: z.string().uuid(),
    index: z.coerce.number().int().nonnegative(),
})

export const uploadBlogImageSchema = z.object({
    files: z.array(
        z.object({
            file_name: z.string(),
            file_base64: z.string(),
        })
    ),
    thumbnail_index: z.number().int().nonnegative().nullable().optional(),
})

export const uploadedBlogImageSchema = z.object({
    file_path: z.string(),
    mime_type: z.string(),
})

export const uploadBlogImageResponseSchema = z.object({
    images: z.array(z.string()),
    thumbnail_index: z.number().int().nonnegative().nullable(),
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
export type UploadBlogImageInput = z.infer<typeof uploadBlogImageSchema>
export type UploadBlogImageResponse = z.infer<typeof uploadBlogImageResponseSchema>
