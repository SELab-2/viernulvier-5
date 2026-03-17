import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema 
} from '../../utils/rest-schemas.js'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const galleryPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

export const itemPaginationQuerySchema = galleryPaginationQuerySchema.extend({
    galleryId: z.string().uuid().optional(),
})

export const cropPaginationQuerySchema = galleryPaginationQuerySchema.extend({
    itemId: z.string().uuid().optional(),
})

/**
 * Explicit links for the Gallery resource.
 */
export const galleryLinksSchema = z.object({
    self: z.string().url(),
    items: z.string().url().optional(),
})

export const gallerySchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    name: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: galleryLinksSchema.optional(),
})

/**
 * Explicit links for the Item resource.
 */
export const itemLinksSchema = z.object({
    self: z.string().url(),
    gallery: z.string().url().optional(),
    crops: z.string().url().optional(),
})

export const itemSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    type: z.string().nullable(),
    original_filename: z.string().nullable(),
    position: z.number().int().nullable(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    format: z.string().nullable(),
    gallery_id: z.string().uuid().nullable(),
    title: localizedTextSchema,
    description: localizedTextSchema,
    credits: localizedTextSchema,
    link: localizedTextSchema,
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: itemLinksSchema.optional(),
})

/**
 * Explicit links for the Crop resource.
 */
export const cropLinksSchema = z.object({
    self: z.string().url(),
    item: z.string().url().optional(),
})

export const cropSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    name: z.string().nullable(),
    url: z.string().nullable(),
    item_id: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: cropLinksSchema.optional(),
})

export const galleryListSchema = createPaginatedResponseSchema(gallerySchema)
export const singleGallerySchema = createSingleResponseSchema(gallerySchema)

export const itemListSchema = createPaginatedResponseSchema(itemSchema)
export const singleItemSchema = createSingleResponseSchema(itemSchema)

export const cropListSchema = createPaginatedResponseSchema(cropSchema)
export const singleCropSchema = createSingleResponseSchema(cropSchema)

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const updateGallerySchema = z.object({
    apiId: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
})

export const updateItemSchema = z.object({
    apiId: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    original_filename: z.string().nullable().optional(),
    position: z.number().int().nullable().optional(),
    width: z.number().int().nullable().optional(),
    height: z.number().int().nullable().optional(),
    format: z.string().nullable().optional(),
    gallery_id: z.string().uuid().nullable().optional(),
    title: localizedTextSchema.optional(),
    description: localizedTextSchema.optional(),
    credits: localizedTextSchema.optional(),
    link: localizedTextSchema.optional(),
})

export const updateCropSchema = z.object({
    apiId: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    item_id: z.string().uuid().nullable().optional(),
})

export const createGallerySchema = updateGallerySchema
export const createItemSchema = updateItemSchema
export const createCropSchema = updateCropSchema

export const errorSchema = z.object({
    message: z.string(),
})

export type GalleryPaginationQuery = z.infer<typeof galleryPaginationQuerySchema>
export type ItemPaginationQuery = z.infer<typeof itemPaginationQuerySchema>
export type CropPaginationQuery = z.infer<typeof cropPaginationQuerySchema>
export type GalleryResponse = z.infer<typeof gallerySchema>
export type ItemResponse = z.infer<typeof itemSchema>
export type CropResponse = z.infer<typeof cropSchema>
export type GalleryListResponse = z.infer<typeof galleryListSchema>
export type ItemListResponse = z.infer<typeof itemListSchema>
export type CropListResponse = z.infer<typeof cropListSchema>
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type UpdateCropInput = z.infer<typeof updateCropSchema>
export type CreateGalleryInput = z.infer<typeof createGallerySchema>
export type CreateItemInput = z.infer<typeof createItemSchema>
export type CreateCropInput = z.infer<typeof createCropSchema>
