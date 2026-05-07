import { api } from './client'
import { z } from 'zod'

export const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const productionSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    vendor_id: z.string().nullable(),
    box_office_id: z.number().int().nullable(),
    performer_field: z.string().nullable(),
    performer_type: z.string().nullable(),
    attendance_mode: z.string().nullable(),

    super_title: localizedTextSchema,
    title: localizedTextSchema,
    artist: localizedTextSchema,
    meta_title: localizedTextSchema,
    meta_description: localizedTextSchema,
    tagline: localizedTextSchema,
    teaser: localizedTextSchema,
    description: localizedTextSchema,
    description_extra: localizedTextSchema,
    description_2: localizedTextSchema,
    video_1: localizedTextSchema,
    video_2: localizedTextSchema,
    quote: localizedTextSchema,
    quote_source: localizedTextSchema,
    programme: localizedTextSchema,
    info: localizedTextSchema,
    description_short: localizedTextSchema,
    eticket_info: localizedTextSchema,
    custom_data: localizedTextSchema,    
    media_gallery_id: z.string().uuid().nullable(),
    review_gallery_id: z.string().uuid().nullable(),
    poster_gallery_id: z.string().uuid().nullable(),
    uitdatabank_theme: z.string().uuid().nullable(),
    uitdatabank_type: z.string().uuid().nullable(),

    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),

    links: z
        .object({
            self: z.string(),
        })
        .optional(),
})

/**
 * Inferred TypeScript type
 */
export type Production = z.infer<typeof productionSchema>

export type ProductionListItem = {
    id: string
    apiId: string | null
    title: {
        nl?: string
        en?: string
        fr?: string
    } | null
    description_short: {
        nl?: string
        en?: string
        fr?: string
    } | null
    teaser: {
        nl?: string
        en?: string
        fr?: string
    } | null
    description: {
        nl?: string
        en?: string
        fr?: string
    } | null
    created_at: string
}

type PaginatedResponse<T> = {
    data: T[]
}


type ProductionResponse = {
    data: Production
    links: {
        self: string
    }
}

export const getProductionById = (id: string) => {
    return api.get<ProductionResponse>(`/archive/productions/${id}`)
}

export const getRecentProductions = (locale: 'nl' | 'en', limit = 4) => {
    const params = new URLSearchParams({
        page: '1',
        limit: String(limit),
        sort: 'recent',
        lang: locale,
    })

    return api.get<PaginatedResponse<ProductionListItem>>(`/archive/productions?${params.toString()}`)
}