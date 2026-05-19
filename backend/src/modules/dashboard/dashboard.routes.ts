import type { FastifyPluginAsync } from 'fastify'
import { DashboardRepository } from './dashboard.repository.js'
import { DashboardService } from './dashboard.service.js'
import { DashboardController } from './dashboard.controller.js'
import { dashboardSummarySchema, dashboardSummaryQuerySchema } from './dashboard.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'
import { BlogsRepository } from '../blogs/blogs.repository.js'
import { PostersRepository } from '../posters/posters.repository.js'

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
    const blogsRepository = new BlogsRepository(fastify.prisma)
    const postersRepository = new PostersRepository(fastify.prisma)
    const repository = new DashboardRepository(fastify.prisma, blogsRepository, postersRepository)
    const service = new DashboardService(repository)
    const controller = new DashboardController(service)

    fastify.get('/summary', {
        preHandler: [requirePermission(Permission.ARCHIVE_READ)],
        schema: {
            hide: true,
            tags: ['dashboard'],
            summary: 'Get admin dashboard summary',
            querystring: dashboardSummaryQuerySchema,
            response: {
                200: dashboardSummarySchema,
            },
        },
        handler: (request, reply) => controller.getSummary(request as Parameters<typeof controller.getSummary>[0], reply),
    })
}

export default dashboardRoutes
