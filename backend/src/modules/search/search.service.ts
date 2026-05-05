import type { SearchRepository } from './search.repository.js'
import type { ProductionsService } from '../productions/productions.service.js'
import type { PostersService } from '../posters/posters.service.js'
import type { SearchQuery, SearchResultItem } from './search.schema.js'
import type { PaginatedResult } from '../../utils/pagination.js'
import { calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class SearchService {
    constructor(
        private readonly searchRepository: SearchRepository,
        private readonly productionsService: ProductionsService,
        private readonly postersService: PostersService,
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

        // Blogs and posters don't have genres/locations, so exclude them when these filters are active
        const hasGenreOrLocationFilter = (genres && genres.length > 0) || (locations && locations.length > 0)

        // Get total count of matching posters first, then fetch all of them
        const postersPreviewOptions = { search, yearFrom, yearTo, page: 1, limit: 1, sort: 'recent' as const, lang: lang ?? 'nl' }
        const postersPreview = !hasGenreOrLocationFilter
            ? await this.postersService.getPosters(postersPreviewOptions)
            : { total: 0 }

        const [blogResults, prodResults, posterResults] = await Promise.all([
            !hasGenreOrLocationFilter
                ? this.searchRepository.findAllBlogs({ search, yearFrom, yearTo })
                : Promise.resolve([]),
            prodsPreview.total > 0
                ? this.productionsService.getProductions({ ...commonProductionOptions, page: 1, limit: prodsPreview.total })
                : Promise.resolve({ items: [], total: 0, page: 1, limit: 1, totalPages: 0 }),
            postersPreview.total > 0
                ? this.postersService.getPosters({ search, yearFrom, yearTo, page: 1, limit: postersPreview.total, sort: 'recent', lang: lang ?? 'nl' })
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
            image_url: prod.image_url ?? null,
            venue_name: prod.venue_name ?? null,
            venue_names: prod.venue_names ?? [],
            production_genres: prod.production_genres ?? [],
            performer_type: prod.performer_type ?? null,
            attendance_mode: prod.attendance_mode ?? null,
            created_at: prod.created_at ? new Date(prod.created_at).toISOString() : undefined,
        }))

        const posterItems: SearchResultItem[] = posterResults.items.map((poster) => {
            // Extract production title (JSONB) for venue name
            let venueName: string | null = null
            if (poster.production?.title) {
                const title = poster.production.title as Record<string, string> | string | null
                if (typeof title === 'object' && title !== null) {
                    // JSONB object, try to extract localized value
                    venueName = (title.nl || title.en || title.fr || Object.values(title)[0] as string | undefined) ?? null
                } else if (typeof title === 'string') {
                    venueName = title
                }
            }

            return {
                id: poster.id,
                type: 'poster' as const,
                title: poster.title ?? null,
                image_url: `/api/v1/archive/posters/${poster.id}/file`,
                mime_type: poster.mime_type ?? null,
                production_id: poster.production?.id ?? null,
                venue_name: venueName,
                created_at: poster.created_at ? new Date(poster.created_at).toISOString() : undefined,
            }
        })

        // --- merge sorted by date descending ---
        const getDate = (item: SearchResultItem) =>
            item.created_at ? new Date(item.created_at).getTime() : 0

        const merged = [...blogItems, ...prodItems, ...posterItems].sort((a, b) => {
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
