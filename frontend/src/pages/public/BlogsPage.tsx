import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import SearchPagination from '../../components/public/search/SearchPagination'
import SearchResultCard, { type SearchResultItem } from '../../components/public/search/SearchResultCard'
import { getActiveLocale, withLocalePath } from '../../i18n'
import { usePublicMessages } from '../../components/public/PublicMessagesContext'

type LocalizedText = { nl?: string; en?: string; fr?: string } | string | null | undefined

type SearchApiItem = {
    id: string
    title?: LocalizedText
    excerpt?: string
    image_url?: string | null
    date_label?: string | null
    venue_label?: string | null
    genre_label?: string | null
}

type PaginatedApiResponse<T> = {
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

type SearchSort = 'relevance' | 'recent' | 'oldest'

const DEFAULT_PAGE_SIZE = 12
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const

function getLocalizedText(text: LocalizedText, locale: string): string {
    if (!text) return ''
    if (typeof text === 'string') return text

    const values = locale === 'en' ? [text.en, text.nl, text.fr] : [text.nl, text.en, text.fr]
    return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

function normalizeSort(value: string): SearchSort {
    const normalized = value.trim().toLowerCase()
    return normalized === 'recent' || normalized === 'oldest' || normalized === 'relevance' ? normalized : 'recent'
}

function normalizePageSize(value: number): number {
    return PAGE_SIZE_OPTIONS.includes(value as (typeof PAGE_SIZE_OPTIONS)[number]) ? value : DEFAULT_PAGE_SIZE
}

function buildQueryParams(filters: { query: string; sort: SearchSort; page: number; limit: number }) {
    const params = new URLSearchParams()

    if (filters.query.trim()) {
        params.set('search', filters.query.trim())
    }

    params.set('tab', 'blogs')
    params.set('sort', filters.sort)
    params.set('page', String(filters.page))
    params.set('limit', String(filters.limit))

    return params
}

function getPageLabels(current: number, total: number): string[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => String(i + 1))
    }

    const labels: string[] = []
    if (current <= 4) {
        labels.push('1', '2', '3', '4', '5', '...', String(total))
    } else if (current >= total - 3) {
        labels.push('1', '...', String(total - 4), String(total - 3), String(total - 2), String(total - 1), String(total))
    } else {
        labels.push('1', '...', String(current - 1), String(current), String(current + 1), '...', String(total))
    }

    return labels
}

function BlogsPageContent() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const messages = usePublicMessages()
    const searchMessages = messages.search
    const common = messages.common

    const query = searchParams.get('q')?.trim() ?? ''
    const sort = normalizeSort(searchParams.get('sort') ?? 'recent')
    const page = Number.isFinite(Number(searchParams.get('page'))) && Number(searchParams.get('page')) > 0
        ? Number(searchParams.get('page'))
        : 1
    const limit = normalizePageSize(Number.isFinite(Number(searchParams.get('limit'))) ? Number(searchParams.get('limit')) : DEFAULT_PAGE_SIZE)

    const [searchInput, setSearchInput] = useState(query)
    const [entries, setEntries] = useState<SearchResultItem[]>([])
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setSearchInput(query)
    }, [query])

    useEffect(() => {
        const abortController = new AbortController()

        const loadBlogs = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const params = buildQueryParams({ query, sort, page, limit })
                params.set('lang', locale)
                const response = await apiFetch<PaginatedApiResponse<SearchApiItem>>(
                    `/archive/search?${params.toString()}`,
                    { signal: abortController.signal }
                )

                const mapped = response.data.map((item) => ({
                    id: item.id,
                    type: 'blog' as const,
                    title: getLocalizedText(item.title, locale) || searchMessages.fallbackUntitled,
                    excerpt: item.excerpt ?? '',
                    imageUrl: item.image_url ?? undefined,
                    date: item.date_label || '',
                    venue: item.venue_label || '',
                    tag: item.genre_label || searchMessages.fallbackTag,
                    detailHref: withLocalePath(`/blogs/${item.id}`, locale),
                }))

                setEntries(mapped)
                setTotalResults(response.meta.total)
                setTotalPages(Math.max(1, response.meta.totalPages))
            } catch (loadError) {
                if (abortController.signal.aborted) {
                    return
                }
                setError(loadError instanceof Error ? loadError.message : 'Failed to load blogs.')
                setEntries([])
                setTotalResults(0)
                setTotalPages(1)
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        void loadBlogs()

        return () => {
            abortController.abort()
        }
    }, [query, sort, page, limit, locale, searchMessages.fallbackTag, searchMessages.fallbackUntitled])

    const pushFilters = useCallback(
        (nextFilters: { query?: string; sort?: SearchSort; page?: number; limit?: number }) => {
            const params = new URLSearchParams()
            const q = nextFilters.query ?? query
            const nextSort = nextFilters.sort ?? sort
            const nextPage = nextFilters.page ?? page
            const nextLimit = nextFilters.limit ?? limit

            if (q?.trim()) params.set('q', q.trim())
            if (nextSort !== 'recent') params.set('sort', nextSort)
            if (nextPage > 1) params.set('page', String(nextPage))
            if (nextLimit !== DEFAULT_PAGE_SIZE) params.set('limit', String(nextLimit))

            const path = withLocalePath('/blogs', locale)
            const qs = params.toString()
            navigate(qs ? `${path}?${qs}` : path)
        },
        [locale, navigate, query, sort, page, limit]
    )

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        pushFilters({ query: searchInput.trim(), page: 1 })
    }

    const handleSortChange = (nextSort: string) => {
        pushFilters({ sort: normalizeSort(nextSort), page: 1 })
    }

    const handlePageChange = (nextPage: number) => {
        if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > totalPages) return
        pushFilters({ page: nextPage })
    }

    const pageLabels = getPageLabels(Math.min(page, totalPages), totalPages)

    return (
        <section className="site-container py-12">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-semibold text-foreground">{searchMessages.blogTab}</h1>
                    <p className="mt-3 max-w-3xl text-sm text-muted">{searchMessages.blogPageSubtitle}</p>
                </div>
                <div className="grid gap-6">
                    <div>
                        <form className="mb-6" onSubmit={handleSearchSubmit}>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder={searchMessages.blogPageSearchPlaceholder}
                                    className="h-12 w-full rounded-full border border-border bg-surface px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                                <button
                                    type="submit"
                                    className="h-12 rounded-full bg-black px-6 text-sm font-semibold text-white transition hover:bg-surface/90 hover:text-black"
                                >
                                    {messages.nav.searchLink}
                                </button>
                            </div>
                        </form>

                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted">{totalResults} {searchMessages.resultsSuffix}</p>
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-muted" htmlFor="blog-sort">{searchMessages.sortLabel}</label>
                                <select
                                    id="blog-sort"
                                    className="h-10 rounded-full border border-border bg-surface px-4 text-sm text-foreground"
                                    value={sort}
                                    onChange={(event) => handleSortChange(event.target.value)}
                                >
                                    <option value="recent">{searchMessages.sortRecent}</option>
                                    <option value="oldest">{searchMessages.sortOldest}</option>
                                    <option value="relevance">{searchMessages.sortDefault}</option>
                                </select>
                                <select
                                    className="h-10 rounded-full border border-border bg-surface px-4 text-sm text-foreground"
                                    value={String(limit)}
                                    onChange={(event) => pushFilters({ limit: Number(event.target.value), page: 1 })}
                                >
                                    {PAGE_SIZE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error ? (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-700">
                                {error}
                            </div>
                        ) : null}

                        {isLoading ? (
                            <div className="grid min-h-[260px] place-items-center rounded-3xl border border-border bg-surface-inset p-10 text-sm text-muted">
                                {common.loading}
                            </div>
                        ) : entries.length > 0 ? (
                            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                                {entries.map((entry) => (
                                    <SearchResultCard key={entry.id} item={entry} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-border bg-surface-inset p-10 text-sm text-muted">
                                {searchMessages.noResults}
                            </div>
                        )}

                        {totalPages > 1 ? (
                            <SearchPagination
                                previousLabel={searchMessages.paginationPrevious}
                                nextLabel={searchMessages.paginationNext}
                                pages={pageLabels}
                                currentPage={String(Math.min(page, totalPages))}
                                onPrevious={() => handlePageChange(Math.min(page, totalPages) - 1)}
                                onNext={() => handlePageChange(Math.min(page, totalPages) + 1)}
                                onPageSelect={(pageLabel) => handlePageChange(Number(pageLabel))}
                                canGoPrevious={page > 1}
                                canGoNext={page < totalPages}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    )
}

function BlogsPage() {
    return (
        <PublicLayout>
            <BlogsPageContent />
        </PublicLayout>
    )
}

export default BlogsPage
