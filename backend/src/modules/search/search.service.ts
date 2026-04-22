import type { ProductionsRepository } from '../productions/productions.repository.js'
import type { BlogsRepository } from '../blogs/blogs.repository.js'
import type { SearchQuery, SearchResultItem } from './search.schema.js'
import type { PaginatedResult } from '../../utils/pagination.js'
import { calculateTotalPages, sanitizePage } from '../../utils/pagination.js'
import { ProductionsService } from '../productions/productions.service.js'

// Maximum items fetched internally from each source to merge & paginate.
// For a theatre archive this ceiling is never hit in practice.
const INTERNAL_MAX = 1000

export class SearchService {
    private readonly productionsService: ProductionsService

    constructor(
        private readonly productionsRepo: ProductionsRepository,
        private readonly blogsRepo: BlogsRepository,
    ) {
        this.productionsService = new ProductionsService(productionsRepo)
    }

    async search(options: SearchQuery): Promise<PaginatedResult<SearchResultItem>> {
        const { page, limit, search, yearFrom, yearTo, genres, locations, sort, lang } = options

        // --- fetch all matching items from both sources ---
        const [blogResults, prodResults] = await Promise.all([
            this.blogsRepo.findAll({
                page: 1,
                limit: INTERNAL_MAX,
                search,
                yearFrom,
                yearTo,
            }),
            this.productionsService.getProductions({
                page: 1,
                limit: INTERNAL_MAX,
                search,
                genres,
                locations,
                yearFrom,
                yearTo,
                sort,
                lang,
                onThisDay: false,
            }),
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
            image_url: prod.image_url ?? null,
            venue_name: prod.venue_name ?? null,
            venue_names: prod.venue_names ?? [],
            production_genres: prod.production_genres ?? [],
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
