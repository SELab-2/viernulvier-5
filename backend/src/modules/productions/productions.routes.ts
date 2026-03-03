import type { FastifyPluginAsync } from 'fastify'
import { ProductionsRepository } from './productions.repository.js'
import { ProductionsService } from './productions.service.js'
import { ProductionsController } from './productions.controller.js'
import { paginationQuerySchema, productionListSchema } from './productions.schema.js'

const productionsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new ProductionsRepository(fastify.prisma)
    const service = new ProductionsService(repository)
    const controller = new ProductionsController(service)

    fastify.get('/', {
        schema: {
            tags: ['productions'],
            summary: 'Get a paginated list of productions',
            querystring: paginationQuerySchema,
            response: {
                200: productionListSchema,
            },
        },
        handler: (request, reply) => controller.getProductions(request as any, reply),
    })
}

export default productionsRoutes
