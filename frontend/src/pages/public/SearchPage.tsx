import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import type { Locale } from '../../i18n/types'
import { apiFetch } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import SearchPagination from '../../components/public/search/SearchPagination'
import SearchResultCard, { type SearchResultItem } from '../../components/public/search/SearchResultCard'

type SearchEntry = SearchResultItem & {
    year: number
    genre: string
    location: string
    createdTimestamp: number
}

const PAGE_SIZE = 6
const API_FETCH_LIMIT = 100
const MIN_PERIOD_YEAR = 1982
const MAX_PERIOD_YEAR = 2026

type LocalizedText = {
    nl?: string
    en?: string
    fr?: string
} | null

type ProductionApiItem = {
    id: string
    title: LocalizedText
    teaser: LocalizedText
    description_short: LocalizedText
    custom_data: {
        image_url?: string
    } | null
    performer_type: string | null
    attendance_mode: string | null
    created_at: string
}

type PaginatedApiResponse<T> = {
    data: T[]
}

function getLocalizedText(text: LocalizedText, locale: Locale): string {
    if (!text) {
        return ''
    }

    const values = locale === 'en' ? [text.en, text.nl, text.fr] : [text.nl, text.en, text.fr]
    return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

function formatDate(value: string, locale: Locale): string {
    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
        return '-'
    }

    return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(parsedDate)
}

function mapProductionToSearchEntry(item: ProductionApiItem, locale: Locale): SearchEntry {
    const title = getLocalizedText(item.title, locale) || (locale === 'nl' ? 'Zonder titel' : 'Untitled')
    const excerpt = getLocalizedText(item.description_short, locale) || getLocalizedText(item.teaser, locale) || title
    const createdDate = new Date(item.created_at)
    const createdTimestamp = Number.isNaN(createdDate.getTime()) ? 0 : createdDate.getTime()
    const year = Number.isNaN(createdDate.getTime()) ? MIN_PERIOD_YEAR : createdDate.getFullYear()
    const normalizedGenre = (item.performer_type ?? '').trim().toLowerCase()
    const normalizedLocation = (item.attendance_mode ?? '').trim().toLowerCase()

    return {
        id: item.id,
        tag: normalizedGenre || (locale === 'nl' ? 'productie' : 'production'),
        date: formatDate(item.created_at, locale),
        title,
        excerpt,
        venue: normalizedLocation || 'VIERNULVIER',
        imageUrl: item.custom_data?.image_url,
        year,
        genre: normalizedGenre,
        location: normalizedLocation,
        createdTimestamp,
    }
}

async function copyCurrentUrl() {
    const currentUrl = window.location.href

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl)
        return
    }

    const textArea = document.createElement('textarea')
    textArea.value = currentUrl
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'absolute'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
}

function parseSelectedGenres(searchParams: URLSearchParams): string[] {
    const genresParam = (searchParams.get('genres') ?? '').trim().toLowerCase()
    const legacyGenre = (searchParams.get('genre') ?? '').trim().toLowerCase()

    if (genresParam) {
        return genresParam
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    }

    return legacyGenre ? [legacyGenre] : []
}

function parseSelectedLocations(searchParams: URLSearchParams): string[] {
    const locationsParam = (searchParams.get('locations') ?? '').trim().toLowerCase()
    const legacyLocation = (searchParams.get('location') ?? '').trim().toLowerCase()

    if (locationsParam) {
        return locationsParam
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    }

    return legacyLocation ? [legacyLocation] : []
}

function HamburgerIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
    )
}

function CloseIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
    )
}

type FilterPanelProps = {
    className?: string
    onAfterChange?: () => void
    showSearch?: boolean
    shareLabel?: string
    onShare?: () => void
}

function FilterPanel({ className, onAfterChange, showSearch = true, shareLabel, onShare }: FilterPanelProps) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const { search: s } = getMessages(locale)

    const query = (searchParams.get('q') ?? '').trim()
    const legacyYear = Number(searchParams.get('year') ?? String(MAX_PERIOD_YEAR))
    const yearFromParam = Number(searchParams.get('yearFrom') ?? String(MIN_PERIOD_YEAR))
    const yearToParam = Number(searchParams.get('yearTo') ?? String(Number.isFinite(legacyYear) ? legacyYear : MAX_PERIOD_YEAR))
    const periodFromYear = Number.isFinite(yearFromParam) ? Math.min(MAX_PERIOD_YEAR, Math.max(MIN_PERIOD_YEAR, yearFromParam)) : MIN_PERIOD_YEAR
    const periodToYear = Number.isFinite(yearToParam) ? Math.min(MAX_PERIOD_YEAR, Math.max(MIN_PERIOD_YEAR, yearToParam)) : MAX_PERIOD_YEAR
    const safeFromYear = Math.min(periodFromYear, periodToYear)
    const safeToYear = Math.max(periodFromYear, periodToYear)
    const selectedGenres = parseSelectedGenres(searchParams)
    const selectedLocations = parseSelectedLocations(searchParams)
    const sort = (searchParams.get('sort') ?? 'relevance').trim().toLowerCase()

    const [searchInput, setSearchInput] = useState(query)

    useEffect(() => {
        setSearchInput(query)
    }, [query])

    const pushFilters = (filters: { query?: string; yearFrom?: number; yearTo?: number; genres?: string[]; locations?: string[]; sort?: string }) => {
        const params = new URLSearchParams()
        if (filters.query) params.set('q', filters.query)
        if (filters.yearFrom && filters.yearFrom > MIN_PERIOD_YEAR) params.set('yearFrom', String(filters.yearFrom))
        if (filters.yearTo && filters.yearTo < MAX_PERIOD_YEAR) params.set('yearTo', String(filters.yearTo))
        if (filters.genres && filters.genres.length > 0) params.set('genres', filters.genres.join(','))
        if (filters.locations && filters.locations.length > 0) params.set('locations', filters.locations.join(','))
        if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort)
        const path = withLocalePath('/zoeken', locale)
        const qs = params.toString()
        navigate(qs ? `${path}?${qs}` : path)
        onAfterChange?.()
    }

    const handleSearchSubmit = () => {
        pushFilters({ query: searchInput.trim() || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort })
    }

    const handleGenreChange = (next: string) => {
        const nextGenres = selectedGenres.includes(next)
            ? selectedGenres.filter((value) => value !== next)
            : [...selectedGenres, next]

        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: nextGenres, locations: selectedLocations, sort })
    }

    const handleLocationChange = (next: string) => {
        const nextLocations = selectedLocations.includes(next)
            ? selectedLocations.filter((value) => value !== next)
            : [...selectedLocations, next]

        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: nextLocations, sort })
    }

    const handleFromYearChange = (next: number) => {
        const clampedNext = Math.min(next, safeToYear)
        pushFilters({ query: query || undefined, yearFrom: clampedNext, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort })
    }

    const handleToYearChange = (next: number) => {
        const clampedNext = Math.max(next, safeFromYear)
        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: clampedNext, genres: selectedGenres, locations: selectedLocations, sort })
    }

    const handleReset = () => {
        pushFilters({ yearFrom: MIN_PERIOD_YEAR, yearTo: MAX_PERIOD_YEAR, sort })
    }

    const yearRange = MAX_PERIOD_YEAR - MIN_PERIOD_YEAR
    const fromPercent = ((safeFromYear - MIN_PERIOD_YEAR) / yearRange) * 100
    const toPercent = ((safeToYear - MIN_PERIOD_YEAR) / yearRange) * 100

    return (
        <aside className={`flex flex-col ${className}`}>
            <h2 className="text-3xl text-foreground">{s.heading}</h2>
            <p className="mt-2 text-xs text-muted">{s.subtitle}</p>

            {showSearch ? (
                <form
                    className="mt-6"
                    onSubmit={(event) => {
                        event.preventDefault()
                        handleSearchSubmit()
                    }}
                >
                    <div className="relative">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder={s.searchPlaceholder}
                            className="h-10 w-full rounded-full border border-border bg-white px-4 pr-10 text-sm text-black"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="search">
                            ⌕
                        </button>
                    </div>
                </form>
            ) : null}

            <div className="mt-8 border-t border-border pt-5">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">{s.genreLabel}</h3>
                </div>
                <div className="space-y-2 text-sm text-text-accent">
                    {s.genres.map((label) => {
                        const value = label.toLowerCase()
                        return (
                            <label key={value} className="flex items-center gap-2.5 text-foreground/90">
                                <input
                                    type="checkbox"
                                    checked={selectedGenres.includes(value)}
                                    onChange={() => handleGenreChange(value)}
                                    className="filter-checkbox"
                                />
                                <span>{label}</span>
                            </label>
                        )
                    })}
                </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">{s.periodLabel}</h3>
                <div className="range-slider mt-5">
                    <div className="range-track" />
                    <div className="range-track-active" style={{ left: `${fromPercent}%`, width: `${toPercent - fromPercent}%` }} />

                    <input
                        type="range"
                        min={MIN_PERIOD_YEAR}
                        max={MAX_PERIOD_YEAR}
                        value={safeFromYear}
                        onChange={(event) => handleFromYearChange(Number(event.target.value))}
                        className="range-input"
                        aria-label="Start year"
                    />
                    <input
                        type="range"
                        min={MIN_PERIOD_YEAR}
                        max={MAX_PERIOD_YEAR}
                        value={safeToYear}
                        onChange={(event) => handleToYearChange(Number(event.target.value))}
                        className="range-input"
                        aria-label="End year"
                    />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>{MIN_PERIOD_YEAR}</span>
                    <span className="rounded-full bg-foreground px-2 py-0.5 font-semibold text-surface">
                        {safeFromYear} - {safeToYear}
                    </span>
                    <span>{MAX_PERIOD_YEAR}</span>
                </div>
            </div>

            <div className="mt-6 border-t border-border pt-5 pb-5">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">{s.locationLabel}</h3>
                <div className="mt-4 space-y-2 text-sm text-text-accent">
                    {s.locations.map((label) => {
                        const value = label.toLowerCase()
                        return (
                            <label key={value} className="flex items-center gap-2.5 text-foreground/90">
                                <input
                                    type="checkbox"
                                    checked={selectedLocations.includes(value)}
                                    onChange={() => handleLocationChange(value)}
                                    className="filter-checkbox"
                                />
                                <span>{label}</span>
                            </label>
                        )
                    })}
                </div>
            </div>

            <div className="mt-auto space-y-3">
                <button
                    type="button"
                    className="h-10 w-full rounded-full border border-border bg-surface text-sm font-semibold text-foreground md:hidden"
                    onClick={() => {
                        onShare?.()
                    }}
                >
                    {shareLabel ?? s.shareLabel}
                </button>
                <button
                    type="button"
                    className="h-10 w-full rounded-full bg-black text-sm font-semibold text-white"
                    onClick={handleReset}
                >
                    {s.resetFiltersLabel}
                </button>
            </div>
        </aside>
    )
}

function MobileSearchForm() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const { search: s } = getMessages(locale)
    const [searchInput, setSearchInput] = useState((searchParams.get('q') ?? '').trim())

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const params = new URLSearchParams(searchParams)
        const nextQuery = searchInput.trim()

        if (nextQuery) {
            params.set('q', nextQuery)
        } else {
            params.delete('q')
        }

        params.delete('page')

        const path = withLocalePath('/zoeken', locale)
        const qs = params.toString()
        navigate(qs ? `${path}?${qs}` : path)
    }

    return (
        <form className="mb-5 md:hidden" onSubmit={handleSubmit}>
            <div className="relative">
                <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={s.searchPlaceholder}
                    className="h-10 w-full rounded-full border border-border bg-white px-4 pr-10 text-sm text-black"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="search">
                    ⌕
                </button>
            </div>
        </form>
    )
}

function SearchPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const m = getMessages(locale)
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
    const [shareCopied, setShareCopied] = useState(false)
    const [apiEntries, setApiEntries] = useState<SearchEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [apiError, setApiError] = useState<string | null>(null)

    const query = (searchParams.get('q') ?? '').trim()
    const legacyYear = Number(searchParams.get('year') ?? String(MAX_PERIOD_YEAR))
    const yearFromParam = Number(searchParams.get('yearFrom') ?? String(MIN_PERIOD_YEAR))
    const yearToParam = Number(searchParams.get('yearTo') ?? String(Number.isFinite(legacyYear) ? legacyYear : MAX_PERIOD_YEAR))
    const periodFromYear = Number.isFinite(yearFromParam) ? Math.min(MAX_PERIOD_YEAR, Math.max(MIN_PERIOD_YEAR, yearFromParam)) : MIN_PERIOD_YEAR
    const periodToYear = Number.isFinite(yearToParam) ? Math.min(MAX_PERIOD_YEAR, Math.max(MIN_PERIOD_YEAR, yearToParam)) : MAX_PERIOD_YEAR
    const safeFromYear = Math.min(periodFromYear, periodToYear)
    const safeToYear = Math.max(periodFromYear, periodToYear)
    const selectedGenres = parseSelectedGenres(searchParams)
    const selectedLocations = parseSelectedLocations(searchParams)
    const sort = (searchParams.get('sort') ?? 'relevance').trim().toLowerCase()
    const pageParam = Number(searchParams.get('page') ?? '1')
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

    useEffect(() => {
        const abortController = new AbortController()

        const loadSearchEntries = async () => {
            setIsLoading(true)
            setApiError(null)

            try {
                const params = new URLSearchParams({
                    page: '1',
                    limit: String(API_FETCH_LIMIT),
                    lang: locale,
                })

                if (query) {
                    params.set('search', query)
                }

                const response = await apiFetch<PaginatedApiResponse<ProductionApiItem>>(
                    `/v1/archive/productions?${params.toString()}`,
                    { signal: abortController.signal }
                )

                const mappedEntries = response.data.map((item) => mapProductionToSearchEntry(item, locale))
                setApiEntries(mappedEntries)
            } catch (error) {
                if (abortController.signal.aborted) {
                    return
                }

                const message = error instanceof Error ? error.message : 'Request failed'
                setApiError(message)
                setApiEntries([])
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        void loadSearchEntries()

        return () => {
            abortController.abort()
        }
    }, [query, locale])

    const filtered = useMemo(() => {
        return apiEntries.filter((item) => {
            const queryMatches =
                query === '' ||
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.excerpt.toLowerCase().includes(query.toLowerCase())

            const yearMatches = item.year >= safeFromYear && item.year <= safeToYear
            const genreMatches = selectedGenres.length === 0 || selectedGenres.includes(item.genre.toLowerCase())
            const locationMatches = selectedLocations.length === 0 || selectedLocations.includes(item.location.toLowerCase())

            return queryMatches && yearMatches && genreMatches && locationMatches
        })
    }, [apiEntries, query, safeFromYear, safeToYear, selectedGenres, selectedLocations])

    const sorted = useMemo(() => {
        const items = [...filtered]

        if (sort === 'recent') {
            items.sort((a, b) => b.createdTimestamp - a.createdTimestamp)
            return items
        }

        if (sort === 'oldest') {
            items.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
            return items
        }

        if (sort === 'title-asc') {
            items.sort((a, b) => a.title.localeCompare(b.title, locale))
            return items
        }

        if (sort === 'title-desc') {
            items.sort((a, b) => b.title.localeCompare(a.title, locale))
            return items
        }

        return items
    }, [filtered, sort, locale])

    const navigateWithFilters = (filters: {
        query?: string
        yearFrom?: number
        yearTo?: number
        genres?: string[]
        locations?: string[]
        sort?: string
        page?: number
    }) => {
        const params = new URLSearchParams()
        if (filters.query) params.set('q', filters.query)
        if (filters.yearFrom && filters.yearFrom > MIN_PERIOD_YEAR) params.set('yearFrom', String(filters.yearFrom))
        if (filters.yearTo && filters.yearTo < MAX_PERIOD_YEAR) params.set('yearTo', String(filters.yearTo))
        if (filters.genres && filters.genres.length > 0) params.set('genres', filters.genres.join(','))
        if (filters.locations && filters.locations.length > 0) params.set('locations', filters.locations.join(','))
        if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort)
        if (filters.page && filters.page > 1) params.set('page', String(filters.page))
        const path = withLocalePath('/zoeken', locale)
        const qs = params.toString()
        navigate(qs ? `${path}?${qs}` : path)
    }

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const start = (currentPage - 1) * PAGE_SIZE
    const pageItems = sorted.slice(start, start + PAGE_SIZE)

    const pageLabels = Array.from({ length: totalPages }, (_, index) => String(index + 1))
    const apiErrorHint =
        apiError && /500|network error/i.test(apiError)
            ? locale === 'nl'
                ? 'Controleer of de backend draait op http://localhost:3001.'
                : 'Check if the backend is running on http://localhost:3001.'
            : null

    const handlePageChange = (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages) {
            return
        }

        navigateWithFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: selectedGenres,
            locations: selectedLocations,
            sort,
            page: nextPage,
        })
    }

    const handleSortChange = (nextSort: string) => {
        navigateWithFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: selectedGenres,
            locations: selectedLocations,
            sort: nextSort,
        })
    }

    const handleRemoveGenreChip = (genreToRemove: string) => {
        navigateWithFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: selectedGenres.filter((value) => value !== genreToRemove),
            locations: selectedLocations,
            sort,
        })
    }

    const handleRemoveLocationChip = (locationToRemove: string) => {
        navigateWithFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: selectedGenres,
            locations: selectedLocations.filter((value) => value !== locationToRemove),
            sort,
        })
    }

    const handleResetPeriodChip = () => {
        navigateWithFilters({
            query: query || undefined,
            yearFrom: MIN_PERIOD_YEAR,
            yearTo: MAX_PERIOD_YEAR,
            genres: selectedGenres,
            locations: selectedLocations,
            sort,
        })
    }

    const handleShare = async () => {
        await copyCurrentUrl()
        setShareCopied(true)
        window.setTimeout(() => {
            setShareCopied(false)
        }, 1800)
    }

    const filterChips: Array<{ key: string; label: string; onRemove: () => void }> = [
        ...selectedGenres.map((value) => ({
            key: `genre-${value}`,
            label: value,
            onRemove: () => handleRemoveGenreChip(value),
        })),
        ...selectedLocations.map((value) => ({
            key: `location-${value}`,
            label: value,
            onRemove: () => handleRemoveLocationChip(value),
        })),
        {
            key: 'period',
            label: `${safeFromYear} - ${safeToYear}`,
            onRemove: handleResetPeriodChip,
        },
    ]

    return (
        <PublicLayout>
            <section className="relative bg-surface-sunken">
                <div className="mx-auto w-full max-w-screen-2xl md:flex md:items-start">
                    <FilterPanel className="hidden w-96 shrink-0 self-stretch border-r border-border bg-surface-inset px-6 py-8 md:flex" />

                    <div className="flex w-full items-start">
                        <div className="z-30 flex w-12 shrink-0 self-stretch justify-center border-r border-border bg-grey md:hidden">
                            <div className="fixed top-[65px] left-1.5 z-40 flex items-start justify-center md:hidden">
                                <button
                                    type="button"
                                    className="inline-flex h-9 w-9 items-center justify-center text-foreground"
                                    aria-label={m.search.filterOpenLabel}
                                    onClick={() => setIsMobileFiltersOpen((open) => !open)}
                                >
                                    <HamburgerIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="w-full px-4 py-6 md:px-8 md:py-8">
                            {isMobileFiltersOpen ? (
                                <>
                                    <button
                                        type="button"
                                        className="fixed inset-0 z-40 bg-black/35 md:hidden"
                                        aria-label="close-filters-overlay"
                                        onClick={() => setIsMobileFiltersOpen(false)}
                                    />
                                    <div className="fixed left-0 top-0 z-50 h-full w-[min(84vw,21rem)] overflow-y-auto border-r border-border bg-surface-inset px-4 py-5 md:hidden">
                                        <div className="mb-3 flex items-center justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border"
                                                onClick={() => setIsMobileFiltersOpen(false)}
                                                aria-label="close-filters"
                                            >
                                                <CloseIcon className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <FilterPanel
                                            className="pb-2"
                                            showSearch={false}
                                            shareLabel={shareCopied ? m.search.shareCopiedLabel : m.search.shareLabel}
                                            onShare={() => {
                                                void handleShare()
                                            }}
                                        />
                                    </div>
                                </>
                            ) : null}

                            <MobileSearchForm key={searchParams.toString()} />

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl leading-none text-foreground">
                                        <span className="underline decoration-accent decoration-2 underline-offset-4">{m.search.productionsTab}</span>{' '}
                                        <span className="text-muted">{m.search.blogTab}</span>
                                    </h1>
                                    <p className="mt-2 text-sm text-muted">
                                        <strong className="text-foreground">{sorted.length}</strong> {m.search.resultsSuffix}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-muted">{m.search.sortLabel}</label>
                                    <select
                                        className="h-9 rounded-full border border-border bg-white px-4 text-sm"
                                        value={sort}
                                        onChange={(event) => handleSortChange(event.target.value)}
                                    >
                                        <option value="relevance">{m.search.sortDefault}</option>
                                        <option value="recent">{locale === 'nl' ? 'Recentste eerst' : 'Newest first'}</option>
                                        <option value="oldest">{locale === 'nl' ? 'Oudste eerst' : 'Oldest first'}</option>
                                        <option value="title-asc">{locale === 'nl' ? 'Titel A-Z' : 'Title A-Z'}</option>
                                        <option value="title-desc">{locale === 'nl' ? 'Titel Z-A' : 'Title Z-A'}</option>
                                    </select>
                                    <button
                                        type="button"
                                        className="hidden h-9 items-center gap-2 rounded-full border border-border bg-white px-3 text-sm md:inline-flex"
                                        onClick={() => {
                                            void handleShare()
                                        }}
                                    >
                                        <img src="/share-svgrepo-com.svg" alt="share" className="h-3.5 w-3.5" />
                                        <span>{shareCopied ? m.search.shareCopiedLabel : m.search.shareLabel}</span>
                                    </button>
                                </div>
                            </div>

                        {filterChips.length > 0 ? (
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                {filterChips.map((chip) => (
                                    <button
                                        key={chip.key}
                                        type="button"
                                        onClick={chip.onRemove}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent"
                                        aria-label={`Remove filter ${chip.label}`}
                                    >
                                        <span>{chip.label}</span>
                                        <span className="text-sm leading-none">×</span>
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        {apiError ? (
                            <div className="mt-6 space-y-2 text-base text-muted">
                                <p>{locale === 'nl' ? `Kon resultaten niet laden: ${apiError}` : `Could not load results: ${apiError}`}</p>
                                {apiErrorHint ? <p>{apiErrorHint}</p> : null}
                            </div>
                        ) : isLoading ? (
                            <p className="mt-6 text-base text-muted">{m.common.loading}</p>
                        ) : pageItems.length > 0 ? (
                            <div className="mt-5 grid gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                                {pageItems.map((item) => (
                                    <SearchResultCard key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                            <p className="mt-6 text-base text-muted">{m.search.noResults}</p>
                        )}

                        {totalPages > 1 ? (
                            <SearchPagination
                                previousLabel={m.search.paginationPrevious}
                                nextLabel={m.search.paginationNext}
                                pages={pageLabels}
                                currentPage={String(currentPage)}
                                onPrevious={() => handlePageChange(currentPage - 1)}
                                onNext={() => handlePageChange(currentPage + 1)}
                                onPageSelect={(pageLabel) => handlePageChange(Number(pageLabel))}
                                canGoPrevious={currentPage > 1}
                                canGoNext={currentPage < totalPages}
                            />
                        ) : null}
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    )
}

export default SearchPage
