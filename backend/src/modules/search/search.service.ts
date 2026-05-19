import type { SearchRepository } from './search.repository.js'
import type { SearchQuery, SearchResultItem } from './search.schema.js'
import type { PaginatedResult } from '../../utils/pagination.js'
import { calculateTotalPages } from '../../utils/pagination.js'

export class SearchService {
    constructor(private readonly searchRepository: SearchRepository) {}

    async search(options: SearchQuery): Promise<PaginatedResult<SearchResultItem>> {
        const result = await this.searchRepository.searchAll(options)
        const totalPages = calculateTotalPages(result.total, options.limit)

        return {
            items: result.items,
            total: result.total,
            page: options.page,
            limit: options.limit,
            totalPages,
        }
    }
}
