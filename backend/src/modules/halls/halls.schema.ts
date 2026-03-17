import { z } from 'zod'
import { 
    createPaginatedResponseSchema, 
    createSingleResponseSchema 
} from '../../utils/rest-schemas.js'

const localizedTextSchema = z.object({
    nl: z.string().optional(),
    fr: z.string().optional(),
    en: z.string().optional(),
}).nullable()

export const hallPaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    spaceId: z.string().uuid().optional(),
    search: z.string().optional(),
    lang: z.string().optional().default('nl'),
})

/**
 * Explicit links for the Hall resource.
 */
export const hallLinksSchema = z.object({
    self: z.string().url(),
    space: z.string().url().optional(),
    events: z.string().url().optional(),
})

export const hallSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    vendor_id: z.string().nullable(),
    box_office_id: z.string().nullable(),
    seat_selection: z.string().nullable(),
    open_seating: z.string().nullable(),
    name: localizedTextSchema,
    remark: localizedTextSchema,
    space_id: z.string().uuid().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    links: hallLinksSchema.optional(),
})

export const hallListSchema = createPaginatedResponseSchema(hallSchema)
export const singleHallSchema = createSingleResponseSchema(hallSchema)

export const idParamSchema = z.object({
    id: z.string().uuid(),
})

export const createHallSchema = z.object({
    apiId: z.string().nullable().optional(),
    vendor_id: z.string().nullable().optional(),
    box_office_id: z.string().nullable().optional(),
    seat_selection: z.string().nullable().optional(),
    open_seating: z.string().nullable().optional(),
    name: localizedTextSchema.optional(),
    remark: localizedTextSchema.optional(),
    space_id: z.string().uuid().nullable().optional(),
})

export const updateHallSchema = createHallSchema.partial()

export const errorSchema = z.object({
    message: z.string(),
})

export type HallPaginationQuery = z.infer<typeof hallPaginationQuerySchema>
export type HallResponse = z.infer<typeof hallSchema>
export type HallListResponse = z.infer<typeof hallListSchema>
export type CreateHallInput = z.infer<typeof createHallSchema>
export type UpdateHallInput = z.infer<typeof updateHallSchema>
