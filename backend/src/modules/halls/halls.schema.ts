import { z } from 'zod'

const localizedTextSchema = z.record(z.string())

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export const hallSchema = z.object({
    id: z.string().uuid(),
    name: localizedTextSchema.nullable(),
    space_id: z.string().uuid().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const hallListSchema = z.object({
    data: z.array(hallSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const createHallSchema = z.object({
    name: localizedTextSchema.nullable().optional(),
    space_id: z.string().uuid().nullable().optional(),
})

export const updateHallSchema = z.object({
    name: localizedTextSchema.nullable().optional(),
    space_id: z.string().uuid().nullable().optional(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type HallResponse = z.infer<typeof hallSchema>
export type HallListResponse = z.infer<typeof hallListSchema>
export type CreateHallInput = z.infer<typeof createHallSchema>
export type UpdateHallInput = z.infer<typeof updateHallSchema>
