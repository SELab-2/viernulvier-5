import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export const spaceSchema = z.object({
    id: z.string().uuid(),
    name: z.any().nullable(),
    location_id: z.string().uuid().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const spaceListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const createSpaceSchema = z.object({
    name: z.any().nullable().optional(),
    location_id: z.string().uuid().nullable().optional(),
})

export const updateSpaceSchema = z.object({
    name: z.any().nullable().optional(),
    location_id: z.string().uuid().nullable().optional(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type SpaceResponse = z.infer<typeof spaceSchema>
export type SpaceListResponse = z.infer<typeof spaceListSchema>
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>
