import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

export const productionSchema = z.object({
    id: z.string().uuid(),
    title: z.any().nullable(),
    artist: z.any().nullable(),
    description: z.any().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const productionListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const updateProductionSchema = z.object({
    title: z.any().optional(),
    artist: z.any().optional(),
    description: z.any().optional(),
})

export const updateProductionParamsSchema = z.object({
    id: z.string().uuid(),
})

export const createProductionSchema = z.object({
    title: z.any().nullable().optional(),
    artist: z.any().nullable().optional(),
    description: z.any().nullable().optional(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type ProductionResponse = z.infer<typeof productionSchema>
export type ProductionListResponse = z.infer<typeof productionListSchema>
export type UpdateProductionInput = z.infer<typeof updateProductionSchema>
export type CreateProductionInput = z.infer<typeof createProductionSchema>
