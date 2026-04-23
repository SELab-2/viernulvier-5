import type { SearchRepository } from './search.repository.js'
import type { ProductionsService } from '../productions/productions.service.js'
import type { SearchQuery, SearchResultItem } from './search.schema.js'
import type { PaginatedResult } from '../../utils/pagination.js'
import { calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class SearchService {
    constructor(
        private readonly searchRepository: SearchRepository,
        private readonly productionsService: ProductionsService,
    ) {}

    async search(options: SearchQuery): Promise<PaginatedResult<SearchResultItem>> {
        const { page, limit, search, yearFrom, yearTo, genres, locations, sort, lang } = options

        const commonProductionOptions = {
            search,
            genres,
            locations,
            yearFrom,
            yearTo,
            sort,
            lang,
            onThisDay: false as const,
        }

        // Get total count of matching productions first, then fetch all without an artificial ceiling
        const prodsPreview = await this.productionsService.getProductions({ ...commonProductionOptions, page: 1, limit: 1 })

        const [blogResults, prodResults] = await Promise.all([
            this.searchRepository.findAllBlogs({ search, yearFrom, yearTo }),
            prodsPreview.total > 0
                ? this.productionsService.getProductions({ ...commonProductionOptions, page: 1, limit: prodsPreview.total })
                : Promise.resolve({ items: [], total: 0, page: 1, limit: 1, totalPages: 0 }),
        ])

        // --- map to a common shape ---
        const blogItems: SearchResultItem[] = blogResults.map((blog) => ({
            id: blog.id,
            type: 'blog' as const,
            title: blog.title ?? null,
            content: blog.content ?? null,
            productions: blog.productions,
            created_at: blog.createdAt ? new Date(blog.createdAt).toISOString() : undefined,
        }))

        const prodItems: SearchResultItem[] = prodResults.items.map((prod) => ({
            id: prod.id,
            type: 'production' as const,
            title: prod.title ?? null,
            teaser: prod.teaser ?? null,
            description_short: prod.description_short ?? null,
            description: prod.description ?? null,
            image_url: null,
            venue_name: null,
            venue_names: [],
            production_genres: [],
            performer_type: prod.performer_type ?? null,
            attendance_mode: prod.attendance_mode ?? null,
            created_at: prod.created_at ? new Date(prod.created_at).toISOString() : undefined,
        }))

        // --- merge sorted by date descending ---
        const getDate = (item: SearchResultItem) =>
            item.created_at ? new Date(item.created_at).getTime() : 0

        const merged = [...blogItems, ...prodItems].sort((a, b) => {
            if (sort === 'oldest') return getDate(a) - getDate(b)
            return getDate(b) - getDate(a)
        })

        // --- paginate ---
        const total = merged.length
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)
        const startIndex = (sanitizedPage - 1) * limit
        const pageItems = merged.slice(startIndex, startIndex + limit)

        return {
            items: pageItems,
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }
}
