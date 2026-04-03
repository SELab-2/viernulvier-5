import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from '../src/utils/password.js'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

/**
 * Seed the database with initial data for development.
 */
async function main() {
    console.log('🌱 Seeding database...')

    const adminPasswordHash = await hashPassword('admin123')
    const editorPasswordHash = await hashPassword('editor123')

    await prisma.adminUser.upsert({
        where: { username: 'admin' },
        update: {
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
        create: {
            username: 'admin',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
    })

    await prisma.adminUser.upsert({
        where: { username: 'editor' },
        update: {
            passwordHash: editorPasswordHash,
            role: 'EDITOR',
        },
        create: {
            username: 'editor',
            passwordHash: editorPasswordHash,
            role: 'EDITOR',
        },
    })

    // Seed script intentionally only provisions admin/editor users.

    console.log('✅ Seed complete')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
