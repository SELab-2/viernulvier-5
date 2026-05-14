import type { FastifyReply, FastifyRequest } from 'fastify'
import type { CreatePosterInput, PosterPaginationQuery, PosterResponse, UpdatePosterInput } from './posters.schema.js'
import type { PostersService } from './posters.service.js'
import { buildPaginationLinks } from '../../utils/pagination.js'
import { PostersStorage } from './posters.storage.js'

export class PostersController {
    constructor(
        private readonly service: PostersService,
        private readonly storage: PostersStorage = new PostersStorage(),
    ) {}

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

            const persistedFiles = await this.storage.persistPosterFiles(files)

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
            await this.storage.deleteStoredFiles((poster.files ?? []).map((file: { file_path: string }) => file.file_path))
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
        try {
            const fileStream = await this.storage.getReadablePosterFile(posterFile.file_path)

            if (posterFile.mime_type) {
                reply.type(posterFile.mime_type)
            }

            return reply.send(fileStream)
        } catch {
            return reply.status(404).send({ message: 'Poster file not found' })
        }
    }
}
