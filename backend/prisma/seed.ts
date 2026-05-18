import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import { Pool } from 'pg'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword } from '../src/utils/password.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

config({ path: resolve(__dirname, '../.env') })

type SeedUser = {
    username: string
    password: string
    role: 'ADMIN' | 'EDITOR'
}

function requireSeedEnvVar(env: NodeJS.ProcessEnv, key: string): string {
    const value = env[key]?.trim()

    if (!value) {
        throw new Error(`Missing required seed credential env var: ${key}`)
    }

    return value
}

export function getSeedUsers(env: NodeJS.ProcessEnv = process.env): SeedUser[] {
    return [
        {
            username: requireSeedEnvVar(env, 'CMS_ADMIN_USERNAME'),
            password: requireSeedEnvVar(env, 'CMS_ADMIN_PASSWORD'),
            role: 'ADMIN',
        },
        {
            username: requireSeedEnvVar(env, 'CMS_EDITOR_USERNAME'),
            password: requireSeedEnvVar(env, 'CMS_EDITOR_PASSWORD'),
            role: 'EDITOR',
        },
    ]
}

/**
 * Seed the database with initial data for development.
 */
async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    try {
        console.log('🌱 Seeding database...')

        const seedUsers = getSeedUsers()

        for (const seedUser of seedUsers) {
            const passwordHash = await hashPassword(seedUser.password)

            await prisma.adminUser.upsert({
                where: { username: seedUser.username },
                update: {
                    passwordHash,
                    role: seedUser.role,
                },
                create: {
                    username: seedUser.username,
                    passwordHash,
                    role: seedUser.role,
                },
            })
        }

        // Seed script intentionally only provisions admin/editor users.

        console.log('✅ Seed complete')
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((e) => {
        console.error(e)
        process.exit(1)
    })
}

export { main }
