import type { FastifyPluginAsync } from 'fastify'
import { ArchiveRepository } from './archive.repository.js'
import { ArchiveService } from './archive.service.js'
import { ArchiveController } from './archive.controller.js'

/**
 * Archive routes
 *
 * This demonstrates the wiring pattern:
 *   repository → service → controller → routes
 *
 * Add real routes here once domain models are implemented.
 * Public routes (GET) need no auth.
 * Admin routes (POST/PUT/DELETE) use `preHandler: [requireAuth]`.
 */
const archiveRoutes: FastifyPluginAsync = async (fastify) => {
    // Wire up the dependency chain
    const repository = new ArchiveRepository(fastify.prisma)
    const service = new ArchiveService(repository)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Placeholder until concrete handlers are wired.
    const _controller = new ArchiveController(service)

    // Placeholder health check for this module
    fastify.get('/health', {
        schema: {
            tags: ['archive'],
            summary: 'Archive module health check',
        },
        handler: async () => ({ module: 'archive', status: 'ok' }),
    })

    // TODO: Add real routes, e.g.:
    //
    // Public (read-only):
    //   fastify.get('/', handler)                → list productions
    //   fastify.get('/:id', handler)             → get production detail
    //
    // Admin (auth required):
    //   fastify.post('/', { preHandler: [requireAuth] }, handler)
    //   fastify.put('/:id', { preHandler: [requireAuth] }, handler)
    //   fastify.delete('/:id', { preHandler: [requireAuth] }, handler)
}

export default archiveRoutes
