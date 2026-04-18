import { ProductionsRepository } from './productions.repository.js'
import type { 
    PaginationQuery, 
    UpdateProductionInput, 
    ProductionResponse,
    CreateProductionInput 
} from './productions.schema.js'
import { PaginatedResult, calculateTotalPages } from '../../utils/pagination.js'

export class ProductionsService {
    constructor(private readonly repository: ProductionsRepository) { }

    private getItemPosition(item: any): number {
        return typeof item?.position === 'number' && Number.isFinite(item.position)
            ? item.position
            : Number.POSITIVE_INFINITY
    }

    private sortImageItems(items: any[]): any[] {
        return [...items].sort((a, b) => this.getItemPosition(a) - this.getItemPosition(b))
    }

    private extractPreferredCropUrl(crops: any[]): string | undefined {
        const preferredCropNames = ['fe3_header', 'fe3_grid']

        for (const cropName of preferredCropNames) {
            const preferredCrop = crops.find(
                (crop) => typeof crop?.name === 'string' && crop.name.trim().toLowerCase() === cropName,
            )

            const preferredUrl = this.extractUrlCandidate(preferredCrop?.url)
            if (preferredUrl) {
                return preferredUrl
            }
        }

        for (const crop of crops) {
            const fromCrop = this.extractUrlCandidate(crop?.url)
            if (fromCrop) {
                return fromCrop
            }
        }

        return undefined
    }

    private getLocalizedName(value: unknown): string | null {
        if (!value || typeof value !== 'object') {
            return null
        }

        const name = value as Record<string, unknown>
        const candidates = [name.nl, name.en, name.fr]

        for (const candidate of candidates) {
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                return candidate.trim()
            }
        }

        return null
    }

    private extractUrlCandidate(value: unknown): string | undefined {
        if (typeof value === 'string') {
            const trimmed = value.trim()
            if (trimmed.length > 0 && /^https?:\/\//i.test(trimmed)) {
                return trimmed
            }

            return undefined
        }

        if (!value || typeof value !== 'object') {
            return undefined
        }

        const data = value as Record<string, unknown>
        const preferredKeys = ['url', 'src', 'original', 'href', 'secure_url', 'nl', 'en', 'fr']

        for (const key of preferredKeys) {
            const fromPreferred = this.extractUrlCandidate(data[key])
            if (fromPreferred) {
                return fromPreferred
            }
        }

        for (const nestedValue of Object.values(data)) {
            const fromNested = this.extractUrlCandidate(nestedValue)
            if (fromNested) {
                return fromNested
            }
        }

        return undefined
    }

    private extractImageUrl(production: any): string | null {
        const posterItems = Array.isArray(production.poster_gallery?.items) ? production.poster_gallery.items : []
        const mediaItems = Array.isArray(production.media_gallery?.items) ? production.media_gallery.items : []
        const sortedItems = this.sortImageItems([...posterItems, ...mediaItems])

        for (const item of sortedItems) {
            const crops = Array.isArray(item?.crops) ? item.crops : []

            const fromPreferredCrop = this.extractPreferredCropUrl(crops)
            if (fromPreferredCrop) {
                return fromPreferredCrop
            }

            const fromItem = this.extractUrlCandidate(item?.link)
            if (fromItem) {
                return fromItem
            }
        }

        return null
    }

    private extractVenueName(production: any): string | null {
        const venueNames = this.extractVenueNames(production)
        return venueNames[0] ?? null
    }

    private extractVenueNames(production: any): string[] {
        const events = Array.isArray(production.events) ? production.events : []
        const uniqueNames = new Set<string>()

        for (const event of events) {
            const hallName = this.getLocalizedName(event?.hall?.name)
            if (hallName) {
                uniqueNames.add(hallName)
            }
        }

        return Array.from(uniqueNames)
    }

    private extractProductionGenres(production: any): string[] {
        const links = Array.isArray(production.genre_production) ? production.genre_production : []
        const uniqueGenres = new Set<string>()

        for (const link of links) {
            const genreName = this.getLocalizedName(link?.genre?.name)
            if (genreName) {
                uniqueGenres.add(genreName)
            }
        }

        return Array.from(uniqueGenres)
    }

    private getOnThisDayEventDate(production: any, onThisDayDate?: Date): Date | null {
        if (!onThisDayDate) {
            return null
        }

        const targetMonth = onThisDayDate.getUTCMonth()
        const targetDay = onThisDayDate.getUTCDate()
        const events = Array.isArray(production.events) ? production.events : []

        const matchingDates = events
            .map((event: any) => (event?.starts_at ? new Date(event.starts_at) : null))
            .filter((value: Date | null): value is Date => value instanceof Date && !Number.isNaN(value.getTime()))
            .filter((value: Date) => value.getUTCMonth() === targetMonth && value.getUTCDate() === targetDay)
            .sort((a: Date, b: Date) => a.getTime() - b.getTime())

        return matchingDates[0] ?? null
    }

    private mapProductionResponse(production: any, onThisDayDate?: Date): ProductionResponse {
        return {
            ...production,
            image_url: this.extractImageUrl(production),
            venue_name: this.extractVenueName(production),
            venue_names: this.extractVenueNames(production),
            production_genres: this.extractProductionGenres(production),
            on_this_day_event_date: this.getOnThisDayEventDate(production, onThisDayDate),
        }
    }

    async getProductions(options: PaginationQuery): Promise<PaginatedResult<ProductionResponse>> {
        const { page, limit, search, lang, genres, locations, yearFrom, yearTo, sort, onThisDay, referenceDate } = options
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

        const [items, total] = await Promise.all([
            this.repository.findAll({
                page,
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
            }),
            this.repository.count({
                search: normalizedSearch,
                searchIds,
                lang,
                genres: normalizedGenres,
                locations: normalizedLocations,
                yearFrom: safeYearFrom,
                yearTo: safeYearTo,
                onThisDayDate,
            }),
        ])

        const totalPages = calculateTotalPages(total, limit)

        return {
            items: items.map((item) => this.mapProductionResponse(item, onThisDayDate)) as any,
            total,
            page,
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
