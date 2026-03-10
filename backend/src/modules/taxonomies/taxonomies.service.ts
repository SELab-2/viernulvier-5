import { TaxonomiesRepository } from './taxonomies.repository.js'
import type { 
    PaginationQuery, 
    GenreListResponse, 
    TagListResponse,
    GenreResponse,
    TagResponse,
    CreateGenreInput,
    UpdateGenreInput,
    CreateTagInput,
    UpdateTagInput
} from './taxonomies.schema.js'

export class TaxonomiesService {
    constructor(private readonly repository: TaxonomiesRepository) { }

    async getGenres(options: PaginationQuery): Promise<GenreListResponse> {
        const { page, limit, search, lang } = options

        const [data, total] = await Promise.all([
            this.repository.findAllGenres({ page, limit, search, lang }),
            this.repository.countGenres({ search, lang }),
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            data: data as any,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
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

    async getTags(options: PaginationQuery): Promise<TagListResponse> {
        const { page, limit, search, lang } = options

        const [data, total] = await Promise.all([
            this.repository.findAllTags({ page, limit, search, lang }),
            this.repository.countTags({ search, lang }),
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            data: data as any,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
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
