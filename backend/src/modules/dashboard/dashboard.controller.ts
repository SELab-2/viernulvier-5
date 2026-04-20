import type { FastifyReply, FastifyRequest } from 'fastify'
import { DashboardService } from './dashboard.service.js'

type SummaryQuery = {
    page: number
    limit: number
}

export class DashboardController {
    constructor(private readonly service: DashboardService) {}

    async getSummary(request: FastifyRequest<{ Querystring: SummaryQuery }>, reply: FastifyReply) {
        const { page, limit } = request.query
        const summary = await this.service.getSummary({ page, limit })

        return reply.send({
            data: summary,
        })
    }
}
