import { createReadStream } from 'node:fs'
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreatePosterInput, PosterPaginationQuery, PosterResponse, UpdatePosterInput } from './posters.schema.js'
import type { PostersService } from './posters.service.js'
import { buildPaginationLinks } from '../../utils/pagination.js'
import { env } from '../../config/env.js'

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function sanitizeFilename(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function parseBase64Payload(fileBase64: string): Buffer {
    const normalized = fileBase64.includes(',') ? fileBase64.split(',').pop() ?? '' : fileBase64
    const buffer = Buffer.from(normalized, 'base64')

    if (buffer.length === 0) {
        throw new Error('Poster file payload is invalid')
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
        throw new Error('Poster file is too large')
    }

    return buffer
}

export class PostersController {
    constructor(private readonly service: PostersService) {}

    private getArchiveBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive`
    }

    private getPostersBaseUrl(request: FastifyRequest) {
        return `${this.getArchiveBaseUrl(request)}/posters`
    }

    private mapPosterLinks(poster: any, baseArchiveUrl: string): PosterResponse {
        const productionTitle = poster.production
            ? this.service.mapProductionTitle(poster.production.title, 'nl')
            : ''

        return {
            id: poster.id,
            title: poster.title,
            file_url: `${baseArchiveUrl}/posters/${poster.id}/file`,
            mime_type: poster.mime_type,
            original_filename: poster.original_filename,
            file_size_bytes: poster.file_size_bytes,
            production: poster.production
                ? {
                      id: poster.production.id,
                      title: productionTitle || poster.production.id,
                  }
                : null,
            created_at: poster.created_at,
            updated_at: poster.updated_at,
            links: {
                self: `${baseArchiveUrl}/posters/${poster.id}`,
                file: `${baseArchiveUrl}/posters/${poster.id}/file`,
                production: poster.production ? `${baseArchiveUrl}/productions/${poster.production.id}` : null,
            },
        }
    }

    async getPosters(request: FastifyRequest<{ Querystring: PosterPaginationQuery }>, reply: FastifyReply) {
        const posters = await this.service.getPosters(request.query)
        const archiveBaseUrl = this.getArchiveBaseUrl(request)
        const host = request.headers.host || request.hostname
        const currentUrl = `${request.protocol}://${host}${request.url.split('?')[0]}`

        return reply.status(200).send({
            data: posters.items.map((poster) => this.mapPosterLinks(poster, archiveBaseUrl)),
            meta: {
                total: posters.total,
                page: posters.page,
                limit: posters.limit,
                totalPages: posters.totalPages,
            },
            links: buildPaginationLinks(currentUrl, posters.page, posters.limit, posters.totalPages),
        })
    }

    async getPoster(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const poster = await this.service.getPoster(request.params.id)
        if (!poster) {
            return reply.status(404).send({ message: 'Poster not found' })
        }

        const archiveBaseUrl = this.getArchiveBaseUrl(request)

        return reply.status(200).send({
            data: this.mapPosterLinks(poster, archiveBaseUrl),
            links: {
                self: `${archiveBaseUrl}/posters/${poster.id}`,
            },
        })
    }

    async createPoster(request: FastifyRequest<{ Body: CreatePosterInput }>, reply: FastifyReply) {
        let filePath = ''

        try {
            const body = request.body
            const title = body.title.trim()
            const productionId = body.production_id.trim()
            const mimeType = body.mime_type.trim().toLowerCase()
            const fileName = body.file_name.trim()

            if (!title) {
                return reply.status(400).send({ message: 'Poster title is required' })
            }

            if (!isValidUuid(productionId)) {
                return reply.status(400).send({ message: 'Valid productionId is required' })
            }

            if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
                return reply.status(400).send({ message: 'Poster file must be an image (jpg, png, webp, gif)' })
            }

            const fileBuffer = parseBase64Payload(body.file_base64)
            const uploadDir = path.resolve(process.cwd(), env.POSTER_LOCATION)
            await mkdir(uploadDir, { recursive: true })

            const originalName = fileName || 'poster-file'
            const safeName = sanitizeFilename(originalName)
            const generatedName = `${crypto.randomUUID()}-${safeName}`
            filePath = path.join(uploadDir, generatedName)
            await writeFile(filePath, fileBuffer)

            const poster = await this.service.createPoster({
                title,
                production_id: productionId,
                file_path: filePath,
                mime_type: mimeType,
                original_filename: originalName,
                file_size_bytes: fileBuffer.length,
            })

            const archiveBaseUrl = this.getArchiveBaseUrl(request)
            const selfUrl = `${archiveBaseUrl}/posters/${poster.id}`

            return reply
                .status(201)
                .header('Location', selfUrl)
                .send({
                    data: this.mapPosterLinks(poster, archiveBaseUrl),
                    links: {
                        self: selfUrl,
                    },
                })
        } catch (error) {
            if (filePath) {
                await unlink(filePath).catch(() => undefined)
            }

            if (error instanceof Error) {
                const knownValidationError = [
                    'Poster title is required',
                    'Valid productionId is required',
                    'Poster file is too large',
                    'Poster file payload is invalid',
                ].includes(error.message)

                if (knownValidationError) {
                    return reply.status(400).send({ message: error.message })
                }
            }

            throw error
        }
    }

    async updatePoster(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdatePosterInput }>,
        reply: FastifyReply,
    ) {
        try {
            const poster = await this.service.updatePoster(request.params.id, request.body)
            const archiveBaseUrl = this.getArchiveBaseUrl(request)

            return reply.status(200).send({
                data: this.mapPosterLinks(poster, archiveBaseUrl),
                links: {
                    self: `${archiveBaseUrl}/posters/${poster.id}`,
                },
            })
        } catch (error) {
            if (error instanceof Error && error.message.includes('Record to update not found')) {
                return reply.status(404).send({ message: 'Poster not found' })
            }

            throw error
        }
    }

    async deletePoster(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const poster = await this.service.deletePoster(request.params.id)
            await unlink(poster.file_path).catch(() => undefined)
            return reply.status(204).send()
        } catch (error) {
            if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
                return reply.status(404).send({ message: 'Poster not found' })
            }

            throw error
        }
    }

    async getPosterFile(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const poster = await this.service.getPoster(request.params.id)
        if (!poster) {
            return reply.status(404).send({ message: 'Poster not found' })
        }

        try {
            await stat(poster.file_path)
        } catch {
            return reply.status(404).send({ message: 'Poster file not found' })
        }

        if (poster.mime_type) {
            reply.type(poster.mime_type)
        }

        return reply.send(createReadStream(poster.file_path))
    }
}
