import { z } from 'zod'

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
    updatedAt: z.date(),
})

const countsSchema = z.object({
    productions: z.number().int().nonnegative(),
    events: z.number().int().nonnegative(),
    mediaItems: z.number().int().nonnegative(),
    editors: z.number().int().nonnegative(),
})

export const dashboardSummarySchema = z.object({
    data: z.object({
        counts: countsSchema,
        recentItems: z.array(recentItemSchema),
        lastScrapedAt: z.date().nullable(),
    }),
})
