import type { FastifyPluginAsync } from 'fastify'
import { MediaRepository } from './media.repository.js'
import { MediaService } from './media.service.js'
import { MediaController } from './media.controller.js'
import { 
    paginationQuerySchema, 
    galleryListSchema, 
    gallerySchema,
    itemListSchema, 
    itemSchema,
    cropListSchema,
    cropSchema,
    idParamSchema,
    errorSchema
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

    fastify.get('/galleries/:id', {
        schema: {
            tags: ['media'],
            summary: 'Get a gallery by ID',
            params: idParamSchema,
            response: { 
                200: gallerySchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getGallery(request as any, reply),
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

    fastify.get('/items/:id', {
        schema: {
            tags: ['media'],
            summary: 'Get a media item by ID',
            params: idParamSchema,
            response: { 
                200: itemSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getItem(request as any, reply),
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

    fastify.get('/items/crops/:id', {
        schema: {
            tags: ['media'],
            summary: 'Get a crop by ID',
            params: idParamSchema,
            response: { 
                200: cropSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getCrop(request as any, reply),
    })
}

export default mediaRoutes
