import { z } from 'zod'
import { createSingleResponseSchema } from '../../utils/rest-schemas.js'

export const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(6),
})

/**
 * Explicit links for the Auth/User resource.
 */
const authLinkSchema = z.string().regex(/^\/[^\s]*$/).default('/api/v1/auth/me')

export const authLinksSchema = z.object({
    self: authLinkSchema,
    logout: authLinkSchema.optional().default('/api/v1/auth/logout'),
})

export const userSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
    role: z.string(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    links: authLinksSchema.optional(),
})

export const authResponseSchema = z.object({
    data: z.object({
        user: userSchema,
    }),
    links: z.object({
        self: authLinkSchema.default('/api/v1/auth/login'),
    })
})

export const updateMeSchema = z.object({
    username: z.string().min(1).optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional(),
}).refine(
    (value) => value.username !== undefined || value.newPassword !== undefined,
    {
        message: 'At least one field must be updated',
    }
).refine(
    (value) => (value.newPassword === undefined && value.currentPassword === undefined)
        || (value.newPassword !== undefined && value.currentPassword !== undefined),
    {
        message: 'Current password is required to set a new password',
        path: ['currentPassword'],
    }
)

export const meResponseSchema = createSingleResponseSchema(userSchema)

export const errorSchema = z.object({
    message: z.string(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type UpdateMeInput = z.infer<typeof updateMeSchema>
export type UserResponse = z.infer<typeof userSchema>
