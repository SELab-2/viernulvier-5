import { UitdatabankRepository } from './uitdatabank.repository.js'
import type { 
    PaginationQuery, 
    KeywordListResponse, 
    ThemeListResponse,
    TypeListResponse,
    KeywordResponse,
    ThemeResponse,
    TypeResponse
} from './uitdatabank.schema.js'

export class UitdatabankService {
    constructor(private readonly repository: UitdatabankRepository) { }

    async getKeywords(options: PaginationQuery): Promise<KeywordListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllKeywords({ page, limit, search }),
            this.repository.countKeywords(search),
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        }
    }

    async getKeyword(id: string): Promise<KeywordResponse | null> {
        return this.repository.findKeywordById(id) as any
    }

    async getThemes(options: PaginationQuery): Promise<ThemeListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllThemes({ page, limit, search }),
            this.repository.countThemes(search),
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        }
    }

    async getTheme(id: string): Promise<ThemeResponse | null> {
        return this.repository.findThemeById(id) as any
    }

    async getTypes(options: PaginationQuery): Promise<TypeListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllTypes({ page, limit, search }),
            this.repository.countTypes(search),
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        }
    }

    async getType(id: string): Promise<TypeResponse | null> {
        return this.repository.findTypeById(id) as any
    }
}
