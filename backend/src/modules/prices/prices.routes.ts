import type { FastifyPluginAsync } from 'fastify'
import { PricesRepository } from './prices.repository.js'
import { PricesService } from './prices.service.js'
import { PricesController } from './prices.controller.js'
import { 
    paginationQuerySchema, 
    priceListSchema,
    rankListSchema
} from './prices.schema.js'

const pricesRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new PricesRepository(fastify.prisma)
    const service = new PricesService(repository)
    const controller = new PricesController(service)

    fastify.get('/', {
        schema: {
            tags: ['prices'],
            summary: 'Get a paginated list of prices',
            querystring: paginationQuerySchema,
            response: {
                200: priceListSchema,
            },
        },
        handler: (request, reply) => controller.getPrices(request as any, reply),
    })

    fastify.get('/ranks', {
        schema: {
            tags: ['prices'],
            summary: 'Get a paginated list of price ranks',
            querystring: paginationQuerySchema,
            response: {
                200: rankListSchema,
            },
        },
        handler: (request, reply) => controller.getRanks(request as any, reply),
    })
}

export default pricesRoutes
