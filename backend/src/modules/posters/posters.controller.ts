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
const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])

function sanitizeFilename(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
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

/**
 * Detects the MIME type of a file by inspecting its magic bytes.
 * Supported formats: JPEG (FF D8 FF), PNG (89 50 4E 47), GIF (47 49 46 38),
 * PDF (25 50 44 46), WebP (RIFF....WEBP).
 * Returns null when the signature does not match any supported type.
 */
function detectMimeType(buffer: Buffer): string | null {
    // WebP detection requires at least 12 bytes; use that as the minimum
    if (buffer.length < 12) return null

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'image/jpeg'
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
    ) {
        return 'image/png'
    }

    // GIF: 47 49 46 38 ("GIF8")
    if (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38
    ) {
        return 'image/gif'
    }

    // PDF: 25 50 44 46 ("%PDF")
    if (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
    ) {
        return 'application/pdf'
    }

    // WebP: RIFF????WEBP — bytes 0-3 "RIFF", bytes 8-11 "WEBP"
    if (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
    ) {
        return 'image/webp'
    }

    return null
}

/**
 * Returns the absolute path for a poster file given its stored name.
 * If the stored name is already an absolute path (legacy data), it is returned as-is.
 */
function resolveStoredFilePath(storedName: string): string {
    if (path.isAbsolute(storedName)) {
        return storedName
    }
    return path.join(path.resolve(process.cwd(), env.POSTER_LOCATION), storedName)
}

export class PostersController {
    constructor(private readonly service: PostersService) {}

    private getLang(lang?: string) {
        return lang === 'en' || lang === 'fr' ? lang : 'nl'
    }

    private getArchiveBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive`
    }

    private mapPosterLinks(poster: any, baseArchiveUrl: string, lang: string = 'nl'): PosterResponse {
        const productionTitle = poster.production
            ? this.service.mapProductionTitle(poster.production.title, lang)
            : ''
        const productions = Array.isArray(poster.productions)
            ? poster.productions.map((production: { id: string; title: unknown }) => {
                  const localizedTitle = this.service.mapProductionTitle(production.title, lang)
                  return {
                      id: production.id,
                      title: localizedTitle || production.id,
                  }
              })
            : []
        const files = Array.isArray(poster.files)
            ? poster.files.map((file: { id: string; mime_type: string | null; original_filename: string | null; file_size_bytes: number | null }) => ({
                  id: file.id,
                  file_url: `${baseArchiveUrl}/posters/${file.id}/file`,
                  mime_type: file.mime_type,
                  original_filename: file.original_filename,
                  file_size_bytes: file.file_size_bytes,
              }))
            : []
        const primaryFile = files[0]

        return {
            id: poster.id,
            title: poster.title,
            file_url: primaryFile?.file_url ?? `${baseArchiveUrl}/posters/${poster.id}/file`,
            mime_type: primaryFile?.mime_type ?? poster.mime_type,
            original_filename: primaryFile?.original_filename ?? poster.original_filename,
            file_size_bytes: primaryFile?.file_size_bytes ?? poster.file_size_bytes,
            files,
            production: poster.production
                ? {
                      id: poster.production.id,
                      title: productionTitle || poster.production.id,
                  }
                : null,
            productions,
            created_at: poster.created_at,
            updated_at: poster.updated_at,
            links: {
                self: `${baseArchiveUrl}/posters/${poster.id}`,
                file: primaryFile?.file_url ?? `${baseArchiveUrl}/posters/${poster.id}/file`,
                production: poster.production ? `${baseArchiveUrl}/productions/${poster.production.id}` : null,
            },
        }
    }

    async getPosters(request: FastifyRequest<{ Querystring: PosterPaginationQuery }>, reply: FastifyReply) {
        const posters = await this.service.getPosters(request.query)
        const archiveBaseUrl = this.getArchiveBaseUrl(request)
        const host = request.headers.host || request.hostname
        const currentUrl = `${request.protocol}://${host}${request.url}`
        const lang = this.getLang(request.query.lang)

        return reply.status(200).send({
            data: posters.items.map((poster) => this.mapPosterLinks(poster, archiveBaseUrl, lang)),
            meta: {
                total: posters.total,
                page: posters.page,
                limit: posters.limit,
                totalPages: posters.totalPages,
            },
            links: buildPaginationLinks(currentUrl, posters.page, posters.limit, posters.totalPages),
        })
    }

    async getPoster(request: FastifyRequest<{ Params: { id: string }; Querystring: { lang?: string } }>, reply: FastifyReply) {
        const poster = await this.service.getPoster(request.params.id)
        if (!poster) {
            return reply.status(404).send({ message: 'Poster not found' })
        }

        const archiveBaseUrl = this.getArchiveBaseUrl(request)
        const lang = this.getLang(request.query.lang)

        return reply.status(200).send({
            data: this.mapPosterLinks(poster, archiveBaseUrl, lang),
            links: {
                self: `${archiveBaseUrl}/posters/${poster.id}`,
            },
        })
    }

    async createPoster(request: FastifyRequest<{ Body: CreatePosterInput; Querystring: { lang?: string } }>, reply: FastifyReply) {
        const storedFileNames: string[] = []

        try {
            const body = request.body
            const title = body.title.trim()
            const productionIds = body.production_ids.map((id: string) => id.trim()).filter(Boolean)
            const files = Array.isArray(body.files) ? body.files : []

            if (!title) {
                return reply.status(400).send({ message: 'Poster title is required' })
            }

            if (productionIds.length === 0) {
                return reply.status(400).send({ message: 'At least one production is required' })
            }

            if (files.length === 0) {
                return reply.status(400).send({ message: 'At least one poster file is required' })
            }

            const uploadDir = path.resolve(process.cwd(), env.POSTER_LOCATION)
            await mkdir(uploadDir, { recursive: true })

            // Phase 1: parse + validate every file before writing any to disk.
            // This prevents orphaned files when a later file fails validation.
            type ValidatedFile = {
                buffer: Buffer
                storedFileName: string
                mime_type: string
                original_filename: string
                file_size_bytes: number
            }
            const validatedFiles: ValidatedFile[] = []

            for (const file of files) {
                const fileName = file.file_name.trim()
                const fileBuffer = parseBase64Payload(file.file_base64)

                // Derive MIME type from actual file bytes -- client-supplied mime_type is ignored
                const detectedMimeType = detectMimeType(fileBuffer)
                if (!detectedMimeType || !ALLOWED_UPLOAD_TYPES.has(detectedMimeType)) {
                    return reply.status(400).send({ message: 'Poster file must be an image (jpg, png, webp, gif) or a PDF' })
                }

                const originalName = fileName || 'poster-file'
                const safeName = sanitizeFilename(originalName)
                const storedFileName = `${crypto.randomUUID()}-${safeName}`

                validatedFiles.push({
                    buffer: fileBuffer,
                    storedFileName,
                    mime_type: detectedMimeType,
                    original_filename: originalName,
                    file_size_bytes: fileBuffer.length,
                })
            }

            // Phase 2: all files passed validation — write them to disk.
            const persistedFiles = [] as Array<{
                file_path: string
                mime_type: string
                original_filename: string
                file_size_bytes: number
            }>

            for (const vf of validatedFiles) {
                const absoluteFilePath = path.join(uploadDir, vf.storedFileName)
                await writeFile(absoluteFilePath, vf.buffer)
                storedFileNames.push(vf.storedFileName)

                persistedFiles.push({
                    file_path: vf.storedFileName,
                    mime_type: vf.mime_type,
                    original_filename: vf.original_filename,
                    file_size_bytes: vf.file_size_bytes,
                })
            }

            const poster = await this.service.createPoster({
                title,
                production_ids: productionIds,
                files: persistedFiles,
            })

            const archiveBaseUrl = this.getArchiveBaseUrl(request)
            const lang = this.getLang(request.query.lang)
            const selfUrl = `${archiveBaseUrl}/posters/${poster.id}`

            return reply
                .status(201)
                .header('Location', selfUrl)
                .send({
                    data: this.mapPosterLinks(poster, archiveBaseUrl, lang),
                    links: {
                        self: selfUrl,
                    },
                })
        } catch (error) {
            if (storedFileNames.length > 0) {
                await Promise.all(storedFileNames.map((storedFileName) => unlink(resolveStoredFilePath(storedFileName)).catch(() => undefined)))
            }

            if (error instanceof Error) {
                const knownValidationError = [
                    'Poster title is required',
                    'At least one poster file is required',
                    'Poster file must be an image (jpg, png, webp, gif) or a PDF',
                    'Poster file is too large',
                    'Poster file payload is invalid',
                ].includes(error.message)

                if (knownValidationError || error.message.startsWith('Unknown production IDs: ')) {
                    return reply.status(400).send({ message: error.message })
                }
            }

            throw error
        }
    }

    async updatePoster(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdatePosterInput; Querystring: { lang?: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const poster = await this.service.updatePoster(request.params.id, request.body)
            const archiveBaseUrl = this.getArchiveBaseUrl(request)
            const lang = this.getLang(request.query.lang)

            return reply.status(200).send({
                data: this.mapPosterLinks(poster, archiveBaseUrl, lang),
                links: {
                    self: `${archiveBaseUrl}/posters/${poster.id}`,
                },
            })
        } catch (error) {
            if (error instanceof Error && error.message.includes('Record to update not found')) {
                return reply.status(404).send({ message: 'Poster not found' })
            }

            if (error instanceof Error && error.message.startsWith('Unknown production IDs: ')) {
                return reply.status(400).send({ message: error.message })
            }

            throw error
        }
    }

    async deletePoster(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const poster = await this.service.deletePoster(request.params.id)
            await Promise.all(
                (poster.files ?? []).map((file: { file_path: string }) => unlink(resolveStoredFilePath(file.file_path)).catch(() => undefined)),
            )
            return reply.status(204).send()
        } catch (error) {
            if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
                return reply.status(404).send({ message: 'Poster not found' })
            }

            throw error
        }
    }

    async getPosterFile(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const posterFile = await this.service.getPosterFile(request.params.id)
        if (!posterFile) {
            return reply.status(404).send({ message: 'Poster not found' })
        }

        const absolutePath = resolveStoredFilePath(posterFile.file_path)

        try {
            await stat(absolutePath)
        } catch {
            return reply.status(404).send({ message: 'Poster file not found' })
        }

        if (posterFile.mime_type) {
            reply.type(posterFile.mime_type)
        }

        return reply.send(createReadStream(absolutePath))
    }
}
