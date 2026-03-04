import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

export const priceSchema = z.object({
    id: z.string().uuid(),
    type: z.string().nullable(),
    visibility: z.string().nullable(),
    code: z.string().nullable(),
    description: z.any().nullable(),
    minimum: z.number().nullable(),
    maximum: z.number().nullable(),
    step: z.number().nullable(),
    order: z.number().nullable(),
    auto_select_combo: z.boolean().nullable(),
    include_in_price_range: z.boolean().nullable(),
    cineville_box: z.boolean().nullable(),
    membership: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const priceListSchema = z.object({
    data: z.array(z.any()), // Use any to match existing pattern for Swagger
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export const rankSchema = z.object({
    id: z.string().uuid(),
    description: z.any().nullable(),
    code: z.string().nullable(),
    position: z.number().nullable(),
    sold_out_buffer: z.number().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const rankListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type PriceResponse = z.infer<typeof priceSchema>
export type PriceListResponse = z.infer<typeof priceListSchema>
export type RankResponse = z.infer<typeof rankSchema>
export type RankListResponse = z.infer<typeof rankListSchema>
