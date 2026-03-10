import { z } from 'zod'

const localizedTextSchema = z.record(z.string())

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

export const productionSchema = z.object({
    id: z.string().uuid(),
    title: localizedTextSchema.nullable(),
    artist: localizedTextSchema.nullable(),
    description: localizedTextSchema.nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const productionListSchema = z.object({
    data: z.array(productionSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const updateProductionSchema = z.object({
    title: localizedTextSchema.nullable().optional(),
    artist: localizedTextSchema.nullable().optional(),
    description: localizedTextSchema.nullable().optional(),
})

export const updateProductionParamsSchema = z.object({
    id: z.string().uuid(),
})

export const createProductionSchema = z.object({
    title: localizedTextSchema.nullable().optional(),
    artist: localizedTextSchema.nullable().optional(),
    description: localizedTextSchema.nullable().optional(),
})

export const errorSchema = z.object({
    message: z.string(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type ProductionResponse = z.infer<typeof productionSchema>
export type ProductionListResponse = z.infer<typeof productionListSchema>
export type UpdateProductionInput = z.infer<typeof updateProductionSchema>
export type CreateProductionInput = z.infer<typeof createProductionSchema>
