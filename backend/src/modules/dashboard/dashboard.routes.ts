import type { FastifyPluginAsync } from 'fastify'
import { DashboardRepository } from './dashboard.repository.js'
import { DashboardService } from './dashboard.service.js'
import { DashboardController } from './dashboard.controller.js'
import { dashboardSummarySchema } from './dashboard.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new DashboardRepository(fastify.prisma)
    const service = new DashboardService(repository)
    const controller = new DashboardController(service)

    fastify.get('/summary', {
        preHandler: [requirePermission(Permission.ARCHIVE_READ)],
        schema: {
            tags: ['dashboard'],
            summary: 'Get admin dashboard summary',
            response: {
                200: dashboardSummarySchema,
            },
        },
        handler: (request, reply) => controller.getSummary(request, reply),
    })
}

export default dashboardRoutes
