import { z } from 'zod'
import {
    createPaginatedResponseSchema,
    createSingleResponseSchema
} from '../../utils/rest-schemas.js'

export const cmsUserPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

export const cmsUserLinksSchema = z.object({
    self: z.string().default('/api/v1/cms-users/example'),
})

export const cmsUserSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(1),
    role: z.enum(['ADMIN', 'EDITOR']),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    links: cmsUserLinksSchema.optional(),
})

export const cmsUserListSchema = createPaginatedResponseSchema(cmsUserSchema)
export const singleCmsUserSchema = createSingleResponseSchema(cmsUserSchema)

export const createEditorSchema = z.object({
    username: z.string().min(1).transform((value) => value.trim().toLowerCase()),
    password: z.string().min(6),
})

export const updateEditorSchema = z.object({
    username: z.string().min(1).transform((value) => value.trim().toLowerCase()).optional(),
    password: z.string().min(6).optional(),
})

export const cmsUserIdSchema = z.object({
    id: z.string().uuid(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export type CmsUserPaginationQuery = z.infer<typeof cmsUserPaginationQuerySchema>
export type CmsUserResponse = z.infer<typeof cmsUserSchema>
export type CmsUserListResponse = z.infer<typeof cmsUserListSchema>
export type CreateEditorInput = z.infer<typeof createEditorSchema>
export type UpdateEditorInput = z.infer<typeof updateEditorSchema>
export type CmsUserIdParams = z.infer<typeof cmsUserIdSchema>
