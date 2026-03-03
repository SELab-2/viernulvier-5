import { TaxonomiesRepository } from './taxonomies.repository.js'
import type { PaginationQuery, GenreListResponse } from './taxonomies.schema.js'

export class TaxonomiesService {
    constructor(private readonly repository: TaxonomiesRepository) { }

    async getGenres(options: PaginationQuery): Promise<GenreListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAll({ page, limit, search }),
            this.repository.count(search),
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
}
