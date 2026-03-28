import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema 
} from '../../utils/rest-schemas.js'

export const editorPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

/**
 * Explicit links for the Editor resource.
 */
export const editorLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
})

export const editorSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(1),
    role: z.enum(['ADMIN', 'EDITOR']),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    links: editorLinksSchema.optional(),
})

export const editorListSchema = createPaginatedResponseSchema(editorSchema)
export const singleEditorSchema = createSingleResponseSchema(editorSchema)

export const createEditorSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'EDITOR']).default('EDITOR'),
})

export const updateEditorSchema = z.object({
    username: z.string().min(1).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['ADMIN', 'EDITOR']).optional(),
})

export const editorIdSchema = z.object({
    id: z.string().uuid(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export type EditorPaginationQuery = z.infer<typeof editorPaginationQuerySchema>
export type EditorResponse = z.infer<typeof editorSchema>
export type EditorListResponse = z.infer<typeof editorListSchema>
export type CreateEditorInput = z.infer<typeof createEditorSchema>
export type UpdateEditorInput = z.infer<typeof updateEditorSchema>
export type EditorIdParams = z.infer<typeof editorIdSchema>
