import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema,
    paginationQuerySchema
} from '../../utils/rest-schemas.js'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

const customDataSchema = z.unknown().nullable()

export const productionPaginationQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional(),
    genres: z.string().optional(),
    locations: z.string().optional(),
    yearFrom: z.coerce.number().int().optional(),
    yearTo: z.coerce.number().int().optional(),
    onThisDay: z.enum(['true', 'false'])
        .optional().default('false')
        .transform((val) => val === 'true'),
    pastOnly: z.enum(['true', 'false'])
        .optional()
        .transform((val) => val === undefined ? undefined : val === 'true'),
    referenceDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
            message: 'referenceDate must be a valid YYYY-MM-DD date',
        })
        .optional(),
    sort: z.enum(['relevance', 'recent', 'oldest']).optional().default('relevance'),
    lang: z.string().optional().default('nl'),
    draft: z.enum(['true', 'false', 'all'])
        .default('false')
        .transform((val) => {
            if (val === 'all') return 'all'
            return val === 'true';
        }),
    editorId: z.string().uuid().optional(),
})

/**
 * Explicit links for the Production resource.
 */
export const productionLinksSchema = z.object({
    self: z.string().url().default('https://example.com/'),
    blogs: z.string().url().optional().nullable().default('https://example.com/'),
    events: z.string().url().optional().nullable().default('https://example.com/'),
    genres: z.string().url().optional().nullable().default('https://example.com/'),
    tags: z.string().url().optional().nullable().default('https://example.com/'),
    editors: z.string().url().optional().nullable().default('https://example.com/'),
    media_gallery: z.string().url().optional().nullable().default('https://example.com/'),
    review_gallery: z.string().url().optional().nullable().default('https://example.com/'),
    poster_gallery: z.string().url().optional().nullable().default('https://example.com/'),
    poster: z.string().url().optional().nullable().default('https://example.com/'),
})



const genreSchema = z.object({
    id: z.string().uuid().optional(),
}).passthrough();

const tagSchema = z.object({
    id: z.string().uuid().optional(),
}).passthrough();

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
    custom_data: customDataSchema,
    image_url: z.string().nullable().optional(),
    venue_name: z.string().nullable().optional(),
    venue_names: z.array(z.string()).optional(),
    production_genres: z.array(z.string()).optional(),
    on_this_day_event_date: z.coerce.date().nullable().optional(),
    genres: z.array(genreSchema).optional(),
    tags: z.array(tagSchema).optional(),
    draft: z.boolean().nullable(),
    media_gallery_id: z.string().uuid().nullable(),
    review_gallery_id: z.string().uuid().nullable(),
    poster_gallery_id: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    // RESTful links inside the resource
    links: productionLinksSchema.optional(),
})

export const productionListSchema = createPaginatedResponseSchema(productionSchema)
export const singleProductionSchema = createSingleResponseSchema(productionSchema)

export const updateProductionSchema = z.object({
    apiId: z.string().nullable().optional(),
    vendor_id: z.string().nullable().optional(),
    box_office_id: z.number().int().nullable().optional(),
    performer_field: z.string().nullable().optional(),
    performer_type: z.string().nullable().optional(),
    attendance_mode: z.string().nullable().optional(),
    super_title: localizedTextSchema.optional(),
    title: localizedTextSchema.optional(),
    artist: localizedTextSchema.optional(),
    meta_title: localizedTextSchema.optional(),
    meta_description: localizedTextSchema.optional(),
    tagline: localizedTextSchema.optional(),
    teaser: localizedTextSchema.optional(),
    description: localizedTextSchema.optional(),
    description_extra: localizedTextSchema.optional(),
    description_2: localizedTextSchema.optional(),
    video_1: localizedTextSchema.optional(),
    video_2: localizedTextSchema.optional(),
    quote: localizedTextSchema.optional(),
    quote_source: localizedTextSchema.optional(),
    programme: localizedTextSchema.optional(),
    info: localizedTextSchema.optional(),
    description_short: localizedTextSchema.optional(),
    eticket_info: localizedTextSchema.optional(),
    custom_data: customDataSchema.optional(),
    draft: z.boolean().nullable().default(false).optional(),
    media_gallery_id: z.string().uuid().nullable().optional(),
    review_gallery_id: z.string().uuid().nullable().optional(),
    poster_gallery_id: z.string().uuid().nullable().optional(),
})

export const updateProductionParamsSchema = z.object({
    id: z.string().uuid(),
})

export const createProductionSchema = updateProductionSchema

export const errorSchema = z.object({
    message: z.string(),
})

export type PaginationQuery = z.infer<typeof productionPaginationQuerySchema>
export type ProductionResponse = z.infer<typeof productionSchema>
export type ProductionListResponse = z.infer<typeof productionListSchema>
export type UpdateProductionInput = z.infer<typeof updateProductionSchema>
export type CreateProductionInput = z.infer<typeof createProductionSchema>
