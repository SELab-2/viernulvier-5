import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'
import type { PosterPaginationQuery, UpdatePosterInput } from './posters.schema.js'
import { PostersRepository } from './posters.repository.js'

type PosterRaw = Awaited<ReturnType<PostersRepository['findById']>>

type CreatePosterInput = {
    title: string
    file_path: string
    mime_type?: string | null
    original_filename?: string | null
    file_size_bytes?: number | null
    production_id: string
}

function getLocalizedTitle(value: unknown, lang: string): string {
    if (!value || typeof value !== 'object') {
        return ''
    }

    const source = value as Record<string, unknown>
    const normalizedLang = lang === 'en' || lang === 'fr' ? lang : 'nl'
    const candidates = [source[normalizedLang], source.nl, source.en, source.fr]

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim()
        }
    }

    return ''
}

export class PostersService {
    constructor(private readonly repository: PostersRepository) {}

    async getPosters(options: PosterPaginationQuery): Promise<PaginatedResult<NonNullable<PosterRaw>>> {
        const normalizedSearch = options.search?.trim() || undefined
        const total = await this.repository.count({ search: normalizedSearch })
        const totalPages = calculateTotalPages(total, options.limit)
        const page = sanitizePage(options.page, totalPages)

        const items = await this.repository.findAll({
            page,
            limit: options.limit,
            search: normalizedSearch,
            sort: options.sort,
        })

        return {
            items,
            total,
            page,
            limit: options.limit,
            totalPages,
        }
    }

    async getPoster(id: string): Promise<NonNullable<PosterRaw> | null> {
        return this.repository.findById(id)
    }

    async createPoster(data: CreatePosterInput): Promise<NonNullable<PosterRaw>> {
        return this.repository.create(data)
    }

    async updatePoster(id: string, data: UpdatePosterInput): Promise<NonNullable<PosterRaw>> {
        return this.repository.update(id, data)
    }

    async deletePoster(id: string): Promise<NonNullable<PosterRaw>> {
        return this.repository.delete(id)
    }

    mapProductionTitle(productionTitle: unknown, lang: string): string {
        return getLocalizedTitle(productionTitle, lang)
    }
}
