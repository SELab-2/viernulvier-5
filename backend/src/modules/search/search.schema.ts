import { z } from 'zod'
import { createPaginatedResponseSchema, paginationQuerySchema } from '../../utils/rest-schemas.js'

export const searchQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional(),
    yearFrom: z.coerce.number().int().optional(),
    yearTo: z.coerce.number().int().optional(),
    genres: z.string().optional(),
    locations: z.string().optional(),
    sort: z.enum(['relevance', 'recent', 'oldest']).optional().default('relevance'),
    lang: z.string().optional().default('nl'),
    tab: z.enum(['all', 'productions', 'posters']).optional().default('all'),
})

export const searchResultItemSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['production', 'poster']),
    title: z.union([
        z.string(),
        z.record(z.string(), z.string().nullable()),
    ]).nullable().optional(),
    excerpt: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    date_label: z.string().nullable().optional(),
    venue_label: z.string().nullable().optional(),
    genre_label: z.string().nullable().optional(),
    created_at: z.string().optional(),
    mime_type: z.string().nullable().optional(),
    poster_file_count: z.number().int().positive().optional(),
    production_id: z.string().uuid().nullable().optional(),
    // Legacy fields for backward compatibility
    teaser: z.unknown().nullable().optional(),
    description_short: z.unknown().nullable().optional(),
    description: z.unknown().nullable().optional(),
    content: z.unknown().nullable().optional(),
    venue_name: z.string().nullable().optional(),
    venue_names: z.array(z.string()).optional(),
    production_genres: z.array(z.string()).optional(),
    performer_type: z.string().nullable().optional(),
    attendance_mode: z.string().nullable().optional(),
    productions: z.array(z.string().uuid()).optional(),
})

export const searchListSchema = createPaginatedResponseSchema(searchResultItemSchema)

export type SearchQuery = z.infer<typeof searchQuerySchema>
export type SearchResultItem = z.infer<typeof searchResultItemSchema>
