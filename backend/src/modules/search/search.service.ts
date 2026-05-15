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
                    date_label: blog.created_at ? new Date(blog.created_at).toLocaleDateString('nl-BE') : '',
                    venue_label: '',
                    genre_label: 'Blog',
                    created_at: blog.created_at ? new Date(blog.created_at).toISOString() : undefined,
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

        if (tab === 'posters') {
            const posterResults = await this.postersService.getPosters({
                search,
                yearFrom,
                yearTo,
                page,
                limit,
                sort: sort === 'oldest' ? 'oldest' : 'recent',
                lang: options.lang ?? 'nl',
            })

            return {
                items: posterResults.items.map((poster) => {
                    const primaryProduction = Array.isArray(poster.productions) ? (poster.productions[0] ?? null) : null
                    let venueName: string | null = null
                    if (primaryProduction?.title) {
                        const title = primaryProduction.title as Record<string, string> | string | null
                        if (typeof title === 'object' && title !== null) {
                            const langPreferences = [options.lang, 'nl', 'en', 'fr'].filter(Boolean) as string[]
                            venueName = langPreferences.reduce<string | null>(
                                (acc, l) => acc || (title[l] as string | undefined) || null,
                                null,
                            )
                            if (!venueName && Object.keys(title).length > 0) {
                                venueName = (Object.values(title)[0] as string | undefined) ?? null
                            }
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
                        poster_file_count:
                            Array.isArray(poster.files) && poster.files.length > 0 ? poster.files.length : undefined,
                        production_id: primaryProduction?.id ?? null,
                        venue_label: venueName,
                        date_label: poster.created_at ? new Date(poster.created_at).toLocaleDateString('nl-BE') : '',
                        genre_label: 'Poster',
                        created_at: poster.created_at ? new Date(poster.created_at).toISOString() : undefined,
                    }
                }),
                total: posterResults.total,
                page: posterResults.page,
                limit: posterResults.limit,
                totalPages: posterResults.totalPages,
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
