import { z } from 'zod'

export const imageParamsSchema = z.object({
    uuid: z.string().min(1),
})

export type ImageParams = z.infer<typeof imageParamsSchema>
