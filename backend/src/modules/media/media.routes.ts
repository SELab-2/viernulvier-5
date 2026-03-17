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
    errorSchema,
    createGallerySchema,
    updateGallerySchema,
    createItemSchema,
    updateItemSchema,
    createCropSchema,
    updateCropSchema
} from './media.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'
import { z } from 'zod'

const mediaRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new MediaRepository(fastify.prisma)
    const service = new MediaService(repository)
    const controller = new MediaController(service)

    // Galleries
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

    fastify.post('/galleries', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['media'],
            summary: 'Create a new gallery',
            body: createGallerySchema,
            response: { 201: gallerySchema },
        },
        handler: (request, reply) => controller.createGallery(request as any, reply),
    })

    fastify.patch('/galleries/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['media'],
            summary: 'Update a gallery',
            params: idParamSchema,
            body: updateGallerySchema,
            response: { 
                200: gallerySchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateGallery(request as any, reply),
    })

    fastify.delete('/galleries/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['media'],
            summary: 'Delete a gallery',
            params: idParamSchema,
            response: { 
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteGallery(request as any, reply),
    })

    // Items
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

    fastify.post('/items', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['media'],
            summary: 'Create a new media item',
            body: createItemSchema,
            response: { 201: itemSchema },
        },
        handler: (request, reply) => controller.createItem(request as any, reply),
    })

    fastify.patch('/items/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['media'],
            summary: 'Update a media item',
            params: idParamSchema,
            body: updateItemSchema,
            response: { 
                200: itemSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateItem(request as any, reply),
    })

    fastify.delete('/items/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['media'],
            summary: 'Delete a media item',
            params: idParamSchema,
            response: { 
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteItem(request as any, reply),
    })

    // Crops
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

    fastify.post('/items/crops', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['media'],
            summary: 'Create a new crop',
            body: createCropSchema,
            response: { 201: cropSchema },
        },
        handler: (request, reply) => controller.createCrop(request as any, reply),
    })

    fastify.patch('/items/crops/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['media'],
            summary: 'Update a crop',
            params: idParamSchema,
            body: updateCropSchema,
            response: { 
                200: cropSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateCrop(request as any, reply),
    })

    fastify.delete('/items/crops/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['media'],
            summary: 'Delete a crop',
            params: idParamSchema,
            response: { 
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteCrop(request as any, reply),
    })
}

export default mediaRoutes
