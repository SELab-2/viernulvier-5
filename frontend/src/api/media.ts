import { api } from './client'
import { z } from 'zod'

// Schemas
export const mediaItemSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    type: z.string(),
    original_filename: z.string(),
    position: z.number().int(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    format: z.string().nullable(),
    gallery_id: z.string().uuid(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    credits: z.string().nullable(),
    link: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export const cropSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    name: z.string(),
    url: z.string(),
    item_id: z.string().uuid(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export type MediaItem = z.infer<typeof mediaItemSchema>
export type Crop = z.infer<typeof cropSchema>

// API calls
type GalleryItemsResponse = {
    data: MediaItem[]
}

type CropsResponse = {
    data: Crop[]
}

export const getGalleryItems = (galleryId: string) => {
    return api.get<GalleryItemsResponse>(`/archive/media/items?galleryId=${galleryId}`)
}

export const getItemCrops = (itemId: string) => {
    return api.get<CropsResponse>(`/archive/media/items/crops?itemId=${itemId}`)
}

const HERO_CROP_FALLBACK_ORDER = ['FE3_header', 'FE3_boxed']
const MEDIA_CROP_FALLBACK_ORDER = ['FE3_boxed', 'FE3_header']

export const getPreferredHeroCropUrl = (crops: Crop[]): string | null => {
    for (const name of HERO_CROP_FALLBACK_ORDER) {
        const crop = crops.find((c) => c.name === name)
        if (crop) return crop.url
    }
    return null
}

export const getPreferredMediaCropUrl = (crops: Crop[]): string | null => {
    for (const name of MEDIA_CROP_FALLBACK_ORDER) {
        const crop = crops.find((c) => c.name === name)
        if (crop) return crop.url
    }
    return null
}