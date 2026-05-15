import { z } from 'zod'
import { paginationQuerySchema } from '../../utils/rest-schemas.js'

const deltaSchema = z.object({
    changePct: z.number().int().nullable(),
    direction: z.enum(['up', 'down', 'flat']),
})

const languageStatusSchema = z.object({
    nl: z.enum(['complete', 'attention']),
    en: z.enum(['complete', 'attention', 'missing']),
})

const recentItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    status: z.enum(['available']),
    languageStatus: languageStatusSchema,
    updated_at: z.date(),
})

const countsSchema = z.object({
    productions: z.number().int().nonnegative(),
    events: z.number().int().nonnegative(),
    blogs: z.number().int().nonnegative(),
    mediaItems: z.number().int().nonnegative(),
    editors: z.number().int().nonnegative(),
})

export const dashboardSummaryQuerySchema = paginationQuerySchema.extend({
    limit: z.coerce.number().int().min(1).max(50).default(3),
})

export const dashboardSummarySchema = z.object({
    data: z.object({
        counts: countsSchema,
        recentItems: z.array(recentItemSchema),
        totalRecentItems: z.number().int().nonnegative(),
        lastScrapedAt: z.date().nullable(),
        deltas: z.object({
            productions: deltaSchema,
            blogs: deltaSchema,
        }),
    }),
})
