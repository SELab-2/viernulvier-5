import type { FastifyReply, FastifyRequest } from 'fastify'
import { DashboardService } from './dashboard.service.js'

export class DashboardController {
    constructor(private readonly service: DashboardService) {}

    async getSummary(_request: FastifyRequest, reply: FastifyReply) {
        const summary = await this.service.getSummary()

        return reply.send({
            data: summary,
        })
    }
}
