import { TaxonomiesRepository } from './taxonomies.repository.js'
import type { 
    GenrePaginationQuery,
    TagPaginationQuery,
    GenreResponse, 
    TagResponse,
    CreateGenreInput,
    UpdateGenreInput,
    CreateTagInput,
    UpdateTagInput
} from './taxonomies.schema.js'
import { PaginatedResult, calculateTotalPages } from '../../utils/pagination.js'

export class TaxonomiesService {
    constructor(private readonly repository: TaxonomiesRepository) { }

    async getGenres(options: GenrePaginationQuery): Promise<PaginatedResult<GenreResponse>> {
        const { page, limit, search, lang, productionId } = options

        const [items, total] = await Promise.all([
            this.repository.findAllGenres({ page, limit, search, lang, productionId }),
            this.repository.countGenres({ search, lang, productionId }),
        ])

        const totalPages = calculateTotalPages(total, limit)

        return {
            items: items as any,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async getGenre(id: string): Promise<GenreResponse | null> {
        return this.repository.findGenreById(id) as any
    }

    async createGenre(data: CreateGenreInput): Promise<GenreResponse> {
        return this.repository.createGenre(data) as any
    }

    async updateGenre(id: string, data: UpdateGenreInput): Promise<GenreResponse> {
        return this.repository.updateGenre(id, data) as any
    }

    async deleteGenre(id: string): Promise<void> {
        await this.repository.deleteGenre(id)
    }

    async getTags(options: TagPaginationQuery): Promise<PaginatedResult<TagResponse>> {
        const { page, limit, search, lang, productionId } = options

        const [items, total] = await Promise.all([
            this.repository.findAllTags({ page, limit, search, lang, productionId }),
            this.repository.countTags({ search, lang, productionId }),
        ])

        const totalPages = calculateTotalPages(total, limit)

        return {
            items: items as any,
            total,
            page,
            limit,
            totalPages,
        }
    }

    async getTag(id: string): Promise<TagResponse | null> {
        return this.repository.findTagById(id) as any
    }

    async createTag(data: CreateTagInput): Promise<TagResponse> {
        return this.repository.createTag(data) as any
    }

    async updateTag(id: string, data: UpdateTagInput): Promise<TagResponse> {
        return this.repository.updateTag(id, data) as any
    }

    async deleteTag(id: string): Promise<void> {
        await this.repository.deleteTag(id)
    }
}
