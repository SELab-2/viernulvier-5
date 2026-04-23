import { UitdatabankRepository } from './uitdatabank.repository.js'
import type { 
    UitdatabankPaginationQuery, 
    KeywordResponse,
    ThemeResponse,
    TypeResponse
} from './uitdatabank.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class UitdatabankService {
    constructor(private readonly repository: UitdatabankRepository) { }

    async getKeywords(options: UitdatabankPaginationQuery): Promise<PaginatedResult<KeywordResponse>> {
        const { page, limit, search } = options

        const total = await this.repository.countKeywords(search)
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAllKeywords({ 
            page: sanitizedPage, 
            limit, 
            search 
        })

        return {
            items: items as any,
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getKeyword(id: string): Promise<KeywordResponse | null> {
        return this.repository.findKeywordById(id) as any
    }

    async getThemes(options: UitdatabankPaginationQuery): Promise<PaginatedResult<ThemeResponse>> {
        const { page, limit, search } = options

        const total = await this.repository.countThemes(search)
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAllThemes({ 
            page: sanitizedPage, 
            limit, 
            search 
        })

        return {
            items: items as any,
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getTheme(id: string): Promise<ThemeResponse | null> {
        return this.repository.findThemeById(id) as any
    }

    async getTypes(options: UitdatabankPaginationQuery): Promise<PaginatedResult<TypeResponse>> {
        const { page, limit, search } = options

        const total = await this.repository.countTypes(search)
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAllTypes({ 
            page: sanitizedPage, 
            limit, 
            search 
        })

        return {
            items: items as any,
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getType(id: string): Promise<TypeResponse | null> {
        return this.repository.findTypeById(id) as any
    }
}
