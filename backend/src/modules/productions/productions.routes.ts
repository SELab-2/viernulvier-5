import type { FastifyPluginAsync } from 'fastify'
import { ProductionsRepository } from './productions.repository.js'
import { ProductionsService } from './productions.service.js'
import { ProductionsController } from './productions.controller.js'
import { z } from 'zod'
import { 
    paginationQuerySchema, 
    productionListSchema, 
    productionSchema, 
    updateProductionSchema,
    updateProductionParamsSchema,
    createProductionSchema,
    errorSchema
} from './productions.schema.js'
import { requireAuth } from '../../hooks/require-auth.js'

const productionsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new ProductionsRepository(fastify.prisma)
    const service = new ProductionsService(repository)
    const controller = new ProductionsController(service)

    // GET /api/archive/productions
    fastify.get('/', {
        schema: {
            tags: ['productions'],
            summary: 'Get a paginated list of productions',
            querystring: paginationQuerySchema,
            response: {
                200: productionListSchema,
            },
        },
        handler: (request, reply) => controller.getProductions(request, reply),
    })

    // GET /api/archive/productions/:id
    fastify.get('/:id', {
        schema: {
            tags: ['productions'],
            summary: 'Get a production by ID',
            params: updateProductionParamsSchema, // reuse the one that validates ID as UUID
            response: {
                200: productionSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getProduction(request as any, reply),
    })

    // POST /api/archive/productions
    fastify.post('/', {
        preHandler: [requireAuth],
        schema: {
            tags: ['productions'],
            summary: 'Create a new production',
            body: createProductionSchema,
            response: {
                201: productionSchema,
            },
        },
        handler: (request, reply) => controller.createProduction(request as any, reply),
    })

    // PUT /api/archive/productions/:id
    fastify.put('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['productions'],
            summary: 'Update a production',
            params: updateProductionParamsSchema,
            body: updateProductionSchema,
            response: {
                200: productionSchema,
            },
        },
        handler: (request, reply) => controller.updateProduction(request as any, reply),
    })

    fastify.delete('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['productions'],
            summary: 'Delete a production',
            params: updateProductionParamsSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteProduction(request as any, reply),
    })
}

export default productionsRoutes
