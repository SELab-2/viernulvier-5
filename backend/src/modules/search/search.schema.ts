import { z } from 'zod'
import { createPaginatedResponseSchema } from '../../utils/rest-schemas.js'

export const searchQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    yearFrom: z.coerce.number().int().optional(),
    yearTo: z.coerce.number().int().optional(),
    genres: z.string().optional(),
    locations: z.string().optional(),
    sort: z.enum(['relevance', 'recent', 'oldest']).optional().default('relevance'),
    lang: z.string().optional().default('nl'),
})

export const searchResultItemSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['production', 'blog', 'poster']),
    title: z.unknown().nullable().optional(),
    teaser: z.unknown().nullable().optional(),
    description_short: z.unknown().nullable().optional(),
    description: z.unknown().nullable().optional(),
    content: z.unknown().nullable().optional(),
    image_url: z.string().nullable().optional(),
    mime_type: z.string().nullable().optional(),
    production_id: z.string().uuid().nullable().optional(),
    venue_name: z.string().nullable().optional(),
    venue_names: z.array(z.string()).optional(),
    production_genres: z.array(z.string()).optional(),
    performer_type: z.string().nullable().optional(),
    attendance_mode: z.string().nullable().optional(),
    created_at: z.string().optional(),
    productions: z.array(z.string().uuid()).optional(),
})

export const searchListSchema = createPaginatedResponseSchema(searchResultItemSchema)

export type SearchQuery = z.infer<typeof searchQuerySchema>
export type SearchResultItem = z.infer<typeof searchResultItemSchema>
