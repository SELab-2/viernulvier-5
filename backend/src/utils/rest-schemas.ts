import { z } from 'zod'

/**
 * Top-level links for the response envelope.
 */
export const linkSchema = z.object({
    self: z.string().default('https://example.com/'),
    next: z.string().nullable().optional().default('https://example.com/'),
    prev: z.string().nullable().optional().default('https://example.com/'),
    first: z.string().nullable().optional().default('https://example.com/'),
    last: z.string().nullable().optional().default('https://example.com/'),
})

/**
 * Standard links for an individual resource (HATEOAS).
 */
export const resourceLinksSchema = z.object({
    self: z.string().default('https://example.com/'),
}).catchall(z.string().optional().default('https://example.com/')) // Allows for dynamic links like 'events', 'media', etc.

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
