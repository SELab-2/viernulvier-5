import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

// Gallery
export const gallerySchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const galleryListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

// Item
export const itemSchema = z.object({
    id: z.string().uuid(),
    type: z.string().nullable(),
    original_filename: z.string().nullable(),
    title: z.any().nullable(),
    gallery_id: z.string().uuid().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const itemListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

// Crop
export const cropSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    url: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const cropListSchema = z.object({
    data: z.array(z.any()),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
