import { ProductionsRepository } from './productions.repository.js'
import type { 
    PaginationQuery, 
    UpdateProductionInput, 
    ProductionResponse,
    CreateProductionInput 
} from './productions.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class ProductionsService {
    constructor(private readonly repository: ProductionsRepository) { }

    private mapProductionResponse(production: any): ProductionResponse {
        return {
            ...production,
        }
    }

    async getProductions(options: PaginationQuery): Promise<PaginatedResult<ProductionResponse>> {
        const { page, limit, search, lang, genres, locations, yearFrom, yearTo, sort, onThisDay, referenceDate, draft } = options
        const normalizedSearch = search?.trim() || undefined

        const normalizedGenres = genres
            ? genres
                .split(',')
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean)
            : undefined

        const normalizedLocations = locations
            ? locations
                .split(',')
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean)
            : undefined

        const normalizedYearFrom = typeof yearFrom === 'number' ? Math.max(1900, yearFrom) : undefined
        const normalizedYearTo = typeof yearTo === 'number' ? Math.min(3000, yearTo) : undefined

        const safeYearFrom =
            typeof normalizedYearFrom === 'number' && typeof normalizedYearTo === 'number'
                ? Math.min(normalizedYearFrom, normalizedYearTo)
                : normalizedYearFrom

        const safeYearTo =
            typeof normalizedYearFrom === 'number' && typeof normalizedYearTo === 'number'
                ? Math.max(normalizedYearFrom, normalizedYearTo)
                : normalizedYearTo

        const onThisDayDate = onThisDay
            ? referenceDate
                ? new Date(`${referenceDate}T00:00:00.000Z`)
                : new Date()
            : undefined

        const searchIds = normalizedSearch
            ? await this.repository.findSearchIds(normalizedSearch, lang ?? 'nl')
            : undefined

        const total = await this.repository.count({
            search: normalizedSearch,
            searchIds,
            lang,
            genres: normalizedGenres,
            locations: normalizedLocations,
            yearFrom: safeYearFrom,
            yearTo: safeYearTo,
            onThisDayDate,
            draft,
        })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAll({
            page: sanitizedPage,
            limit,
            search: normalizedSearch,
            searchIds,
            lang,
            genres: normalizedGenres,
            locations: normalizedLocations,
            yearFrom: safeYearFrom,
            yearTo: safeYearTo,
            onThisDayDate,
            sort,
            draft,
        })

        return {
            items: items.map((item) => this.mapProductionResponse(item)) as any,
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getProduction(id: string): Promise<ProductionResponse | null> {
        const production = await this.repository.findById(id)
        if (!production) {
            return null
        }

        return this.mapProductionResponse(production) as any
    }

    async createProduction(data: CreateProductionInput): Promise<ProductionResponse> {
        return this.repository.create(data) as any
    }

    async updateProduction(id: string, data: UpdateProductionInput): Promise<ProductionResponse> {
        return this.repository.update(id, data) as any
    }

    async deleteProduction(id: string): Promise<void> {
        await this.repository.delete(id)
    }
}
