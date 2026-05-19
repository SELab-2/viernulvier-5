import type { FastifyPluginAsync } from 'fastify'
import { ImagesRepository } from './images.repository.js'
import { ImagesService } from './images.service.js'
import { ImagesController } from './images.controller.js'
import { imageParamsSchema } from './images.schema.js'

const imagesRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new ImagesRepository()
    const service = new ImagesService(repository)
    const controller = new ImagesController(service)

    fastify.get('/:uuid', {
        schema: {
            hide: true,
            tags: ['images'],
            summary: 'Get an image by UUID',
            params: imageParamsSchema,
        },
        handler: (request, reply) => controller.getImage(request as any, reply),
    })
}

export default imagesRoutes
