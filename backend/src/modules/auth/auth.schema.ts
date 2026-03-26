import { z } from 'zod'
import { createSingleResponseSchema } from '../../utils/rest-schemas.js'

export const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(6),
})

/**
 * Explicit links for the Auth/User resource.
 */
export const authLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    logout: z.string().url().optional().default('https://example.com/'),
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
        self: z.string().url().default('https://example.com/'),
    })
})

export const meResponseSchema = createSingleResponseSchema(userSchema)

export const errorSchema = z.object({
    message: z.string(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type UserResponse = z.infer<typeof userSchema>
