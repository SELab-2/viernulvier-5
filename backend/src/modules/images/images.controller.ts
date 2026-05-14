import { FastifyReply, FastifyRequest } from 'fastify'
import { ImagesService } from './images.service.js'
import { ImageParams } from './images.schema.js'
import fs from 'fs'
import path from 'path'

export class ImagesController {
    constructor(private readonly service: ImagesService) {}

    async getImage(request: FastifyRequest<{ Params: ImageParams }>, reply: FastifyReply) {
        const { uuid } = request.params
        const filePath = await this.service.getImagePath(uuid)

        if (!filePath) {
            return reply.status(404).send({ message: 'Image not found' })
        }

        const extension = path.extname(filePath).toLowerCase()
        const mimeTypes: Record<string, string> = {
            '.webp': 'image/webp',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
        }

        const contentType = mimeTypes[extension] || 'application/octet-stream'
        
        const stream = fs.createReadStream(filePath)
        
        return reply
            .type(contentType)
            .header('Cross-Origin-Resource-Policy', 'cross-origin')
            .send(stream)
    }
}
