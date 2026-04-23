import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'
import type { CreatePosterPersistenceInput, PosterPaginationQuery, UpdatePosterInput } from './posters.schema.js'
import { PostersRepository, type PosterRecord } from './posters.repository.js'

type PosterRaw = PosterRecord | null

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
        const normalizedYearFrom = typeof options.yearFrom === 'number' ? Math.max(1900, options.yearFrom) : undefined
        const normalizedYearTo = typeof options.yearTo === 'number' ? Math.min(3000, options.yearTo) : undefined

        const safeYearFrom =
            typeof normalizedYearFrom === 'number' && typeof normalizedYearTo === 'number'
                ? Math.min(normalizedYearFrom, normalizedYearTo)
                : normalizedYearFrom

        const safeYearTo =
            typeof normalizedYearFrom === 'number' && typeof normalizedYearTo === 'number'
                ? Math.max(normalizedYearFrom, normalizedYearTo)
                : normalizedYearTo

        const total = await this.repository.count({ search: normalizedSearch, yearFrom: safeYearFrom, yearTo: safeYearTo })
        const totalPages = calculateTotalPages(total, options.limit)
        const page = sanitizePage(options.page, totalPages)

        const items = await this.repository.findAll({
            page,
            limit: options.limit,
            search: normalizedSearch,
            yearFrom: safeYearFrom,
            yearTo: safeYearTo,
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

    async createPoster(data: CreatePosterPersistenceInput): Promise<NonNullable<PosterRaw>> {
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
