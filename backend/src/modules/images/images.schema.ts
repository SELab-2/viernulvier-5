import { z } from 'zod'

export const imageParamsSchema = z.object({
    uuid: z.string().uuid(),
})

export type ImageParams = z.infer<typeof imageParamsSchema>
