import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { defineConfig, env } from 'prisma/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = process.env.PRISMA_ENV_FILE ?? '.env'

dotenv.config({
  path: resolve(__dirname, envFile),
  override: false,
})

export default defineConfig({
  schema: resolve(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
