import 'dotenv/config'
import { z } from 'zod'

/**
 * Environment variable schema.
 * Validated at startup — app crashes fast on missing/invalid config.
 */
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3001),
    HOST: z.string().default('0.0.0.0'),
    JWT_SECRET: z.string().min(8),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
    const result = envSchema.safeParse(process.env)

    if (!result.success) {
        console.error('❌ Invalid environment variables:')
        console.error(result.error.flatten().fieldErrors)
        process.exit(1)
    }

    return result.data
}

export const env = loadEnv()
