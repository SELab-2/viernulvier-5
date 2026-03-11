import { z } from 'zod'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    locationId: z.string().uuid().optional(),
    search: z.string().optional(),
})

export const spaceSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    vendor_id: z.string().nullable(),
    name: localizedTextSchema,
    location_id: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export const spaceListSchema = z.object({
    data: z.array(spaceSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const createSpaceSchema = z.object({
    apiId: z.string().nullable().optional(),
    vendor_id: z.string().nullable().optional(),
    name: localizedTextSchema.optional(),
    location_id: z.string().uuid().nullable().optional(),
})

export const updateSpaceSchema = createSpaceSchema.partial()

export const errorSchema = z.object({
    message: z.string(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type SpaceResponse = z.infer<typeof spaceSchema>
export type SpaceListResponse = z.infer<typeof spaceListSchema>
export type CreateSpaceInput = z.infer<typeof createSpaceSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>
