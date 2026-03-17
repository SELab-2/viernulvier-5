import { z } from 'zod'

/**
 * Top-level links for the response envelope.
 */
export const linkSchema = z.object({
    self: z.string(),
    next: z.string().nullable().optional(),
    prev: z.string().nullable().optional(),
    first: z.string().nullable().optional(),
    last: z.string().nullable().optional(),
})

/**
 * Standard links for an individual resource (HATEOAS).
 */
export const resourceLinksSchema = z.object({
    self: z.string(),
}).catchall(z.string().optional()) // Allows for dynamic links like 'events', 'media', etc.

export const metaSchema = z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
})

/**
 * Creates a paginated response schema for a given data schema.
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
    return z.object({
        data: z.array(dataSchema),
        meta: metaSchema,
        links: linkSchema,
    })
}

/**
 * Creates a single resource response schema for a given data schema.
 */
export function createSingleResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
    return z.object({
        data: dataSchema,
        links: z.object({
            self: z.string(),
        }),
    })
}
