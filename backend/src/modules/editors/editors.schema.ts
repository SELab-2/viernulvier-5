import { z } from 'zod'

export const editorIdParamsSchema = z.object({
    id: z.string().uuid(),
})

export const createEditorSchema = z.object({
    username: z.string().trim().min(1).max(64),
    password: z.string().min(6).max(128),
})

export const updateEditorSchema = z.object({
    username: z.string().trim().min(1).max(64).optional(),
    password: z.string().min(6).max(128).optional(),
}).refine(
    (value) => value.username !== undefined || value.password !== undefined,
    {
        message: 'At least one field is required',
    }
)

export type EditorIdParams = z.infer<typeof editorIdParamsSchema>
export type CreateEditorInput = z.infer<typeof createEditorSchema>
export type UpdateEditorInput = z.infer<typeof updateEditorSchema>
