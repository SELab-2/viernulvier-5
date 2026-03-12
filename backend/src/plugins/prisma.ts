import fp from 'fastify-plugin'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

/**
 * Prisma plugin — creates a PrismaClient with the Prisma 7 adapter pattern.
 * Wrapped with fp() so `fastify.prisma` is available in all scopes.
 *
 * Prisma 7 requires an explicit driver adapter instead of a connection string.
 */
export default fp(async (fastify) => {
    // Create a pg Pool (the underlying driver)
    const pool = new Pool({ connectionString: env.DATABASE_URL })

    // Create the Prisma adapter
    const adapter = new PrismaPg(pool)

    // Create the Prisma client with the adapter
    const prisma = new PrismaClient({ adapter })

    fastify.log.info('Prisma connected to database via pg adapter')

    fastify.decorate('prisma', prisma)

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect()
        await pool.end()
        fastify.log.info('Prisma and pg pool disconnected')
    })
})

// Augment Fastify types so `fastify.prisma` is typed
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient
    }
}
