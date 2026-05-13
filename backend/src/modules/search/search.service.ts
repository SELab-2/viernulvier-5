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
        const { limit, page, tab, search, yearFrom, yearTo, sort } = options

        if (tab === 'blogs') {
            const blogResults = await this.searchRepository.findAllBlogs({ search, yearFrom, yearTo, sort })
            const blogItems: SearchResultItem[] = blogResults.map((blog) => {
                const contentObj = blog.content as Record<string, string> | null
                const lang = options.lang === 'en' || options.lang === 'fr' ? options.lang : 'nl'
                const rawContent = (contentObj?.[lang] || contentObj?.['nl'] || '') as string

                return {
                    id: blog.id,
                    type: 'blog' as const,
                    title: blog.title as any,
                    excerpt: this.searchRepository.stripHtml(rawContent).substring(0, 200),
                    image_url: null,
                    date_label: blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('nl-BE') : '',
                    venue_label: '',
                    genre_label: 'Blog',
                    created_at: blog.createdAt ? new Date(blog.createdAt).toISOString() : undefined,
                    // Legacy support
                    content: blog.content ?? null,
                    productions: blog.productions,
                }
            })

            const total = blogItems.length
            const totalPages = calculateTotalPages(total, limit)
            const sanitizedPage = sanitizePage(page, totalPages)
            const startIndex = (sanitizedPage - 1) * limit
            const items = blogItems.slice(startIndex, startIndex + limit)

            return {
                items,
                total,
                page: sanitizedPage,
                limit,
                totalPages,
            }
        }

        const result = await this.searchRepository.searchAll(options)

        const totalPages = calculateTotalPages(result.total, limit)
        const sanitizedPage = sanitizePage(options.page, totalPages)

        return {
            items: result.items,
            total: result.total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }
}
