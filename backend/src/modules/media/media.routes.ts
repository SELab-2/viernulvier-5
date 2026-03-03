import type { FastifyPluginAsync } from 'fastify'
import { MediaRepository } from './media.repository.js'
import { MediaService } from './media.service.js'
import { MediaController } from './media.controller.js'
import { 
    paginationQuerySchema, 
    galleryListSchema, 
    itemListSchema, 
    cropListSchema 
} from './media.schema.js'

const mediaRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new MediaRepository(fastify.prisma)
    const service = new MediaService(repository)
    const controller = new MediaController(service)

    fastify.get('/galleries', {
        schema: {
            tags: ['media'],
            summary: 'Get a paginated list of galleries',
            querystring: paginationQuerySchema,
            response: { 200: galleryListSchema },
        },
        handler: (request, reply) => controller.getGalleries(request as any, reply),
    })

    fastify.get('/items', {
        schema: {
            tags: ['media'],
            summary: 'Get a paginated list of media items',
            querystring: paginationQuerySchema,
            response: { 200: itemListSchema },
        },
        handler: (request, reply) => controller.getItems(request as any, reply),
    })

    fastify.get('/items/crops', {
        schema: {
            tags: ['media'],
            summary: 'Get a paginated list of image crops',
            querystring: paginationQuerySchema,
            response: { 200: cropListSchema },
        },
        handler: (request, reply) => controller.getCrops(request as any, reply),
    })
}

export default mediaRoutes
