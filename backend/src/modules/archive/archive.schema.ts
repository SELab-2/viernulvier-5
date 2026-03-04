import { z } from 'zod'

/**
 * Archive module schemas
 *
 * Replace these with real schemas once the domain model
 * (production, event, genre, etc.) is implemented in Prisma.
 */

export const idParamsSchema = z.object({
    id: z.string().uuid(),
})

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
})

export type IdParams = z.infer<typeof idParamsSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
