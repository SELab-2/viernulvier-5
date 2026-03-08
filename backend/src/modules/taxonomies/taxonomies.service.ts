import { TaxonomiesRepository } from './taxonomies.repository.js'
import type { 
    PaginationQuery, 
    GenreListResponse, 
    TagListResponse,
    GenreResponse,
    TagResponse
} from './taxonomies.schema.js'

export class TaxonomiesService {
    constructor(private readonly repository: TaxonomiesRepository) { }

    async getGenres(options: PaginationQuery): Promise<GenreListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllGenres({ page, limit, search }),
            this.repository.countGenres(search),
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

    async getTags(options: PaginationQuery): Promise<TagListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllTags({ page, limit, search }),
            this.repository.countTags(search),
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
}
