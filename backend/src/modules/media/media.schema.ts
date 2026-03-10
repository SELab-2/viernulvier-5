import { z } from 'zod'

const localizedTextSchema = z.record(z.string())

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

// Gallery
export const gallerySchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const createGallerySchema = z.object({
    name: z.string().nullable().optional(),
})

export const updateGallerySchema = z.object({
    name: z.string().nullable().optional(),
})

export const galleryListSchema = z.object({
    data: z.array(gallerySchema),
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
    title: localizedTextSchema.nullable(),
    gallery_id: z.string().uuid().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
})

export const createItemSchema = z.object({
    type: z.string().nullable().optional(),
    original_filename: z.string().nullable().optional(),
    title: localizedTextSchema.nullable().optional(),
    gallery_id: z.string().uuid().nullable().optional(),
})

export const updateItemSchema = z.object({
    type: z.string().nullable().optional(),
    original_filename: z.string().nullable().optional(),
    title: localizedTextSchema.nullable().optional(),
    gallery_id: z.string().uuid().nullable().optional(),
})

export const itemListSchema = z.object({
    data: z.array(itemSchema),
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

export const createCropSchema = z.object({
    name: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
})

export const updateCropSchema = z.object({
    name: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
})

export const cropListSchema = z.object({
    data: z.array(cropSchema),
    meta: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    }),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type GalleryResponse = z.infer<typeof gallerySchema>
export type GalleryListResponse = z.infer<typeof galleryListSchema>
export type CreateGalleryInput = z.infer<typeof createGallerySchema>
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>

export type ItemResponse = z.infer<typeof itemSchema>
export type ItemListResponse = z.infer<typeof itemListSchema>
export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>

export type CropResponse = z.infer<typeof cropSchema>
export type CropListResponse = z.infer<typeof cropListSchema>
export type CreateCropInput = z.infer<typeof createCropSchema>
export type UpdateCropInput = z.infer<typeof updateCropSchema>
