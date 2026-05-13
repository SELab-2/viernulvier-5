import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveLocale, withLocalePath } from '../../i18n'
import type { Locale, Messages } from '../../i18n/types'
import { apiFetch } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import { usePublicMessages } from '../../components/public/PublicMessagesContext'
import SearchPagination from '../../components/public/search/SearchPagination'
import SearchResultCard, { type SearchResultItem } from '../../components/public/search/SearchResultCard'

type SearchEntry = SearchResultItem & {
    year: number
    genre: string
    location: string
    type: 'production' | 'blog'
}

const DEFAULT_PAGE_SIZE = 12
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const
const MIN_PERIOD_YEAR = 1982
const MAX_PERIOD_YEAR = new Date().getFullYear()
const SEARCH_INPUT_DEBOUNCE_MS = 250

const CANONICAL_GENRE_VALUES = [
    'concert',
    'nightlife',
    'talks',
    'installation',
    'theatre',
    'performance',
    'dance',
    'comedy',
    'film',
    'spoken word',
    'circus',
    'food',
    'monument',
    'workshop',
    'party',
    'expo',
    'festival',
] as const

const GENRE_ALIASES: Record<string, string> = {
    theater: 'theatre',
    theatre: 'theatre',
    dans: 'dance',
    dance: 'dance',
    music: 'concert',
    komedie: 'comedy',
    talk: 'talks',
    talks: 'talks',
    installatie: 'installation',
    installation: 'installation',
    expo: 'expo',
    tentoonstelling: 'expo',
    food: 'food',
    eten: 'food',
    etenendrinken: 'food',
    'eten & drinken': 'food',
    film: 'film',
    workshop: 'workshop',
    party: 'party',
    monument: 'monument',
    circus: 'circus',
    performance: 'performance',
    festival: 'festival',
    feest: 'party',
    voorstelling: 'performance',
    'spoken-word': 'spoken word',
    spokenword: 'spoken word',
}

const LOCATION_ALIASES: Record<string, string> = {
    'theatre hall': 'theaterzaal',
    ballroom: 'balzaal',
    'dom hall': 'domzaal',
}

type LocalizedText = {
    nl?: string
    en?: string
    fr?: string
} | string | null

type SearchApiItem = {
    id: string
    type: 'production' | 'blog'
    title?: LocalizedText
    excerpt?: string
    image_url?: string | null
    date_label?: string | null
    venue_label?: string | null
    genre_label?: string | null
    created_at?: string
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

type SearchFilterState = {
    query: string
    yearFrom: number
    yearTo: number
    genres: string[]
    locations: string[]
    sort: SearchSort
    page: number
    limit: number
    tab: 'productions' | 'blogs' | 'all'
}

type SearchFilterOverrides = {
    query?: string
    yearFrom?: number
    yearTo?: number
    genres?: string[]
    locations?: string[]
    sort?: SearchSort
    page?: number
    limit?: number
    tab?: 'productions' | 'blogs' | 'all'
}

function getLocalizedText(text: LocalizedText, locale: Locale): string {
    if (!text) {
        return ''
    }

    if (typeof text === 'string') {
        return text
    }

    const values = locale === 'en' ? [text.en, text.nl, text.fr] : [text.nl, text.en, text.fr]
    return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

function normalizeSort(value: string): SearchSort {
    const normalized = value.trim().toLowerCase()
    return normalized === 'recent' || normalized === 'oldest' || normalized === 'relevance' ? normalized : 'relevance'
}

function normalizePageSize(value: number): number {
    return PAGE_SIZE_OPTIONS.includes(value as (typeof PAGE_SIZE_OPTIONS)[number]) ? value : DEFAULT_PAGE_SIZE
}

function parseSearchFilterState(searchParams: URLSearchParams): SearchFilterState {
    const query = (searchParams.get('q') ?? '').trim()
    const legacyYear = Number(searchParams.get('year') ?? String(MAX_PERIOD_YEAR))
    const yearFromParam = Number(searchParams.get('yearFrom') ?? String(MIN_PERIOD_YEAR))
    const yearToParam = Number(searchParams.get('yearTo') ?? String(Number.isFinite(legacyYear) ? legacyYear : MAX_PERIOD_YEAR))
    const periodFromYear = Number.isFinite(yearFromParam) ? Math.min(MAX_PERIOD_YEAR, Math.max(MIN_PERIOD_YEAR, yearFromParam)) : MIN_PERIOD_YEAR
    const periodToYear = Number.isFinite(yearToParam) ? Math.min(MAX_PERIOD_YEAR, Math.max(MIN_PERIOD_YEAR, yearToParam)) : MAX_PERIOD_YEAR
    const yearFrom = Math.min(periodFromYear, periodToYear)
    const yearTo = Math.max(periodFromYear, periodToYear)

    const sort = normalizeSort(searchParams.get('sort') ?? 'relevance')
    const pageParam = Number(searchParams.get('page') ?? '1')
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    const limitParam = Number(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE))
    const limit = normalizePageSize(limitParam)

    const tabParam = searchParams.get('tab')
    const tab: 'productions' | 'blogs' | 'all' = tabParam === 'blogs' ? 'blogs' : tabParam === 'all' ? 'all' : 'productions'

    return {
        query,
        yearFrom,
        yearTo,
        genres: parseSelectedGenres(searchParams),
        locations: parseSelectedLocations(searchParams),
        sort,
        page,
        limit,
        tab,
    }
}

function buildSearchParams(filters: SearchFilterOverrides): URLSearchParams {
    const params = new URLSearchParams()
    const trimmedQuery = filters.query?.trim() ?? ''

    if (trimmedQuery) params.set('q', trimmedQuery)
    if (filters.yearFrom && filters.yearFrom > MIN_PERIOD_YEAR) params.set('yearFrom', String(filters.yearFrom))
    if (filters.yearTo && filters.yearTo < MAX_PERIOD_YEAR) params.set('yearTo', String(filters.yearTo))
    if (filters.genres && filters.genres.length > 0) params.set('genres', filters.genres.join(','))
    if (filters.locations && filters.locations.length > 0) params.set('locations', filters.locations.join(','))
    if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort)
    if (filters.page && filters.page > 1) params.set('page', String(filters.page))
    if (filters.limit && filters.limit !== DEFAULT_PAGE_SIZE) params.set('limit', String(filters.limit))
    if (filters.tab === 'blogs') params.set('tab', 'blogs')
    if (filters.tab === 'all') params.set('tab', 'all')

    return params
}

function useAllHalls(locale: Locale) {
    const [halls, setHalls] = useState<string[]>([])

    useEffect(() => {
        const fetchHalls = async () => {
            try {
                // Fetch more halls to be sure
                const res = await apiFetch<{ data: Array<{ name: LocalizedText }> }>('/archive/halls?limit=500')
                const names = (res.data || [])
                    .map(h => getLocalizedText(h.name, locale))
                    .filter(Boolean)
                
                setHalls(Array.from(new Set(names)).sort())
            } catch {
                // Silently fail
            }
        }
        fetchHalls()
    }, [locale])

    return halls
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
            .map((value) => GENRE_ALIASES[value.trim()] ?? value.trim())
            .filter(Boolean)
    }

    return legacyGenre ? [GENRE_ALIASES[legacyGenre] ?? legacyGenre] : []
}

function parseSelectedLocations(searchParams: URLSearchParams): string[] {
    const locationsParam = (searchParams.get('locations') ?? '').trim().toLowerCase()
    const legacyLocation = (searchParams.get('location') ?? '').trim().toLowerCase()

    if (locationsParam) {
        return locationsParam
            .split(',')
            .map((value) => LOCATION_ALIASES[value.trim()] ?? value.trim())
            .filter(Boolean)
    }

    return legacyLocation ? [LOCATION_ALIASES[legacyLocation] ?? legacyLocation] : []
}

function getGenreLabel(value: string, genreLabels: Messages['search']['genres']): string {
    const index = CANONICAL_GENRE_VALUES.indexOf(value as (typeof CANONICAL_GENRE_VALUES)[number])
    return index >= 0 ? genreLabels[index] ?? value : value
}

function getLocationLabel(value: string): string {
    return value
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
    locationSuggestions?: string[]
}

function FilterPanel({ className, onAfterChange, showSearch = true, shareLabel, onShare, locationSuggestions = [] }: FilterPanelProps) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const { search: s } = usePublicMessages()

    const filterState = useMemo(() => parseSearchFilterState(searchParams), [searchParams])
    const query = filterState.query
    const safeFromYear = filterState.yearFrom
    const safeToYear = filterState.yearTo
    const selectedGenres = filterState.genres
    const selectedLocations = filterState.locations
    const sort = filterState.sort
    const safeLimit = filterState.limit
    const tab = filterState.tab
    const sliderRef = useRef<HTMLDivElement | null>(null)

    const [searchInput, setSearchInput] = useState(query)
    const [locationInput, setLocationInput] = useState('')
    const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState(false)

    useEffect(() => {
        setSearchInput(query)
    }, [query])

    const pushFilters = useCallback((filters: SearchFilterOverrides) => {
        const params = buildSearchParams(filters)
        const path = withLocalePath('/zoeken', locale)
        const qs = params.toString()
        navigate(qs ? `${path}?${qs}` : path)
        onAfterChange?.()
    }, [locale, navigate, onAfterChange])

    useEffect(() => {
        const nextQuery = searchInput.trim()
        if (nextQuery === query) {
            return
        }

        const timerId = window.setTimeout(() => {
            pushFilters({
                query: nextQuery || undefined,
                yearFrom: safeFromYear,
                yearTo: safeToYear,
                genres: selectedGenres,
                locations: selectedLocations,
                sort,
                limit: safeLimit,
                tab,
            })
        }, SEARCH_INPUT_DEBOUNCE_MS)

        return () => {
            window.clearTimeout(timerId)
        }
    }, [searchInput, query, safeFromYear, safeToYear, selectedGenres, selectedLocations, sort, safeLimit, tab, pushFilters])

    const handleSearchSubmit = () => {
        pushFilters({ query: searchInput.trim() || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort, limit: safeLimit, tab })
    }

    const handleGenreChange = (next: string) => {
        const nextGenres = selectedGenres.includes(next) ? [] : [next]

        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: nextGenres, locations: selectedLocations, sort, limit: safeLimit, tab })
    }

    const handleLocationChange = (next: string) => {
        const nextLocations = selectedLocations.includes(next)
            ? selectedLocations.filter((value) => value !== next)
            : [...selectedLocations, next]

        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: nextLocations, sort, limit: safeLimit, tab })
    }

    const handleAddLocation = () => {
        const nextLocation = locationInput.trim().toLowerCase()
        if (!nextLocation || selectedLocations.includes(nextLocation)) {
            setLocationInput('')
            return
        }

        pushFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: selectedGenres,
            locations: [...selectedLocations, nextLocation],
            sort,
            limit: safeLimit,
            tab,
        })
        setLocationInput('')
        setIsLocationSuggestionsOpen(false)
    }

    const normalizedLocationInput = locationInput.trim().toLowerCase()
    const locationSuggestionItems = useMemo(() => {
        if (!normalizedLocationInput) {
            return []
        }

        return locationSuggestions
            .filter((value) => {
                const normalized = value.trim().toLowerCase()
                return (
                    normalized.length > 0 &&
                    normalized.includes(normalizedLocationInput) &&
                    !selectedLocations.includes(normalized)
                )
            })
            .slice(0, 8)
    }, [locationSuggestions, normalizedLocationInput, selectedLocations])

    const handleSelectLocationSuggestion = (value: string) => {
        const nextLocation = value.trim().toLowerCase()
        if (!nextLocation || selectedLocations.includes(nextLocation)) {
            setLocationInput('')
            setIsLocationSuggestionsOpen(false)
            return
        }

        pushFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: selectedGenres,
            locations: [...selectedLocations, nextLocation],
            sort,
            limit: safeLimit,
            tab,
        })
        setLocationInput('')
        setIsLocationSuggestionsOpen(false)
    }

    const handleFromYearChange = (next: number) => {
        const clampedNext = Math.min(next, safeToYear)
        pushFilters({ query: query || undefined, yearFrom: clampedNext, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort, limit: safeLimit, tab })
    }

    const handleToYearChange = (next: number) => {
        const clampedNext = Math.max(next, safeFromYear)
        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: clampedNext, genres: selectedGenres, locations: selectedLocations, sort, limit: safeLimit, tab })
    }

    const handleReset = () => {
        pushFilters({ yearFrom: MIN_PERIOD_YEAR, yearTo: MAX_PERIOD_YEAR, sort, limit: safeLimit, tab })
    }

    const handleSliderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        if (target.closest('input[type="range"]')) {
            return
        }

        const rect = sliderRef.current?.getBoundingClientRect()
        if (!rect || rect.width === 0) {
            return
        }

        const clickRatio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
        const nextYear = Math.round(MIN_PERIOD_YEAR + clickRatio * yearRange)

        if (Math.abs(nextYear - safeFromYear) <= Math.abs(nextYear - safeToYear)) {
            handleFromYearChange(nextYear)
            return
        }

        handleToYearChange(nextYear)
    }

    const yearRange = MAX_PERIOD_YEAR - MIN_PERIOD_YEAR
    const fromPercent = ((safeFromYear - MIN_PERIOD_YEAR) / yearRange) * 100
    const toPercent = ((safeToYear - MIN_PERIOD_YEAR) / yearRange) * 100
    const genreOptions = s.genres.map((label, index) => ({
        label,
        value: CANONICAL_GENRE_VALUES[index] ?? label.toLowerCase(),
    }))
    return (
        <aside className={`flex h-full flex-col ${className}`}>
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
                            className="h-10 w-full rounded-full border border-border bg-surface px-4 pr-10 text-sm text-foreground"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="search">
                            ⌕
                        </button>
                    </div>
                </form>
            ) : null}

            {tab !== 'blogs' ? (
            <div className="mt-8 border-t border-border pt-5">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">{s.genreLabel}</h3>
                </div>
                <div className="space-y-2 text-sm text-text-accent">
                    {genreOptions.map(({ label, value }) => {
                        return (
                            <label key={value} className="flex items-center gap-2.5 text-foreground/90 transition-all duration-200 hover:translate-x-0.5 hover:text-foreground cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedGenres.includes(value)}
                                    onChange={() => handleGenreChange(value)}
                                    className="filter-checkbox cursor-pointer"
                                />
                                <span>{label}</span>
                            </label>
                        )
                    })}
                </div>
            </div>
            ) : null}

            <div className="mt-6 border-t border-border pt-5">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">{s.periodLabel}</h3>
                <div ref={sliderRef} className="range-slider mt-5" onPointerDown={handleSliderPointerDown}>
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

            {tab !== 'blogs' ? (
            <div className="mt-6 border-t border-border pt-5 pb-5">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">{s.locationLabel}</h3>
                <div className="mt-4 space-y-3 text-sm text-text-accent">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={locationInput}
                                onChange={(event) => setLocationInput(event.target.value)}
                                onFocus={() => setIsLocationSuggestionsOpen(true)}
                                onBlur={() => {
                                    window.setTimeout(() => {
                                        setIsLocationSuggestionsOpen(false)
                                    }, 120)
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault()
                                        handleAddLocation()
                                    }
                                }}
                                placeholder={s.locationSearchPlaceholder}
                            className="h-10 w-full rounded-full border border-border bg-surface px-4 text-sm text-foreground"
                        />
                        <button
                            type="button"
                            className="h-10 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground"
                            onClick={handleAddLocation}
                        >
                            {s.addLocationLabel}
                        </button>
                    </div>

                    {isLocationSuggestionsOpen && locationSuggestionItems.length > 0 ? (
                        <div className="max-h-52 overflow-auto rounded-2xl border border-border bg-surface p-1">
                            {locationSuggestionItems.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/10"
                                    onClick={() => handleSelectLocationSuggestion(value)}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    ) : null}

                    {selectedLocations.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedLocations.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        handleLocationChange(value)
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent"
                                >
                                    <span>{getLocationLabel(value)}</span>
                                    <span className="text-sm leading-none">×</span>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
            ) : null}

            <div className="mt-auto space-y-3">
                <button
                    type="button"
                    className="h-10 w-full rounded-full border border-border bg-surface text-sm font-semibold text-foreground md:hidden transition-colors duration-200"
                    onClick={() => {
                        onShare?.()
                    }}
                >
                    {shareLabel ?? s.shareLabel}
                </button>
                <button
                    type="button"
                    className="h-10 w-full rounded-full bg-black text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01] hover:bg-surface/90"
                    onClick={handleReset}
                >
                    {s.resetFiltersLabel}
                </button>
            </div>
        </aside>
    )
}

function MobileSearchForm({ className = 'mb-5 md:hidden' }: { className?: string }) {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const { search: s } = usePublicMessages()
    const filterState = useMemo(() => parseSearchFilterState(searchParams), [searchParams])
    const query = filterState.query
    const [searchInput, setSearchInput] = useState(query)

    useEffect(() => {
        setSearchInput(query)
    }, [query])

    const pushQuery = useCallback((nextQuery: string) => {
        const filterState = parseSearchFilterState(searchParams)
        const params = buildSearchParams({
            query: nextQuery,
            yearFrom: filterState.yearFrom,
            yearTo: filterState.yearTo,
            genres: filterState.genres,
            locations: filterState.locations,
            sort: filterState.sort,
            limit: filterState.limit,
            tab: filterState.tab,
        })
        const path = withLocalePath('/zoeken', locale)
        const qs = params.toString()
        navigate(qs ? `${path}?${qs}` : path)
    }, [searchParams, locale, navigate])

    useEffect(() => {
        const nextQuery = searchInput.trim()
        if (nextQuery === query) {
            return
        }

        const timerId = window.setTimeout(() => {
            pushQuery(nextQuery)
        }, SEARCH_INPUT_DEBOUNCE_MS)

        return () => {
            window.clearTimeout(timerId)
        }
    }, [searchInput, query, pushQuery])

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        pushQuery(searchInput.trim())
    }

    return (
        <form className={className} onSubmit={handleSubmit}>
            <div className="relative">
                <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={s.searchPlaceholder}
                    className="h-10 w-full rounded-full border border-border bg-surface px-4 pr-10 text-sm text-foreground"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="search">
                    ⌕
                </button>
            </div>
        </form>
    )
}

function SearchPageContent() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const m = usePublicMessages()
    const searchMessages = m.search
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
    const [shareCopied, setShareCopied] = useState(false)
    const [apiEntries, setApiEntries] = useState<SearchEntry[]>([])
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [apiError, setApiError] = useState<string | null>(null)

    const allAvailableHalls = useAllHalls(locale)

    const filterState = useMemo(() => parseSearchFilterState(searchParams), [searchParams])
    const query = filterState.query
    const safeFromYear = filterState.yearFrom
    const safeToYear = filterState.yearTo
    const selectedGenres = filterState.genres
    const selectedLocations = filterState.locations
    const sort = filterState.sort
    const page = filterState.page
    const pageSize = filterState.limit
    const tab = filterState.tab

    useEffect(() => {
        const abortController = new AbortController()

        const loadSearchEntries = async () => {
            setIsLoading(true)
            setApiError(null)

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(pageSize),
                    lang: locale,
                    tab,
                })

                if (query) params.set('search', query)
                if (safeFromYear > MIN_PERIOD_YEAR) params.set('yearFrom', String(safeFromYear))
                if (safeToYear < MAX_PERIOD_YEAR) params.set('yearTo', String(safeToYear))
                if (selectedGenres.length > 0) params.set('genres', selectedGenres.join(','))
                if (selectedLocations.length > 0) params.set('locations', selectedLocations.join(','))
                if (sort === 'recent' || sort === 'oldest') params.set('sort', sort)

                const response = await apiFetch<PaginatedApiResponse<SearchApiItem>>(
                    `/archive/search?${params.toString()}`,
                    { signal: abortController.signal }
                )

                const mappedEntries = response.data.map((item): SearchEntry => {
                    const createdDate = new Date(item.created_at ?? '')
                    const year = Number.isNaN(createdDate.getTime()) ? MIN_PERIOD_YEAR : createdDate.getFullYear()

                    return {
                        id: item.id,
                        type: item.type,
                        title: getLocalizedText(item.title as LocalizedText, locale) || searchMessages.fallbackUntitled,
                        excerpt: item.excerpt || '',
                        imageUrl: item.image_url ?? undefined,
                        date: item.date_label || '',
                        venue: item.venue_label || '',
                        tag: item.genre_label || (item.type === 'blog' ? searchMessages.blogTab : searchMessages.fallbackTag),
                        year,
                        genre: item.genre_label || '',
                        location: '', // Handled by backend filter
                    }
                })

                setApiEntries(mappedEntries)
                setTotalResults(response.meta?.total ?? mappedEntries.length)
                setTotalPages(Math.max(1, response.meta?.totalPages ?? 1))
            } catch (error) {
                if (abortController.signal.aborted) {
                    return
                }

                const message = error instanceof Error ? error.message : 'Request failed'
                setApiError(message)
                setApiEntries([])
                setTotalResults(0)
                setTotalPages(1)
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
    }, [query, locale, selectedGenres, selectedLocations, safeFromYear, safeToYear, sort, page, pageSize, tab, searchMessages])

    const navigateWithFilters = (filters: SearchFilterOverrides) => {
        const params = buildSearchParams(filters)
        const path = withLocalePath('/zoeken', locale)
        const qs = params.toString()
        navigate(qs ? `${path}?${qs}` : path)
    }

    const currentPage = Math.min(page, totalPages)
    const pageItems = apiEntries

    // Compacte paginering: 1,2,3,...,laatste
    function getCompactPageLabels(current: number, total: number): string[] {
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

    const pageLabels = getCompactPageLabels(currentPage, totalPages)
    const loadingQuote = useMemo(() => {
        const quotes = m.search.loadingQuotes
        if (quotes.length === 0) {
            return m.common.loading
        }
        const seed = `${query}|${safeFromYear}|${safeToYear}|${selectedGenres.join(',')}|${selectedLocations.join(',')}`
        const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return quotes[hash % quotes.length]
    }, [m.search.loadingQuotes, m.common.loading, query, safeFromYear, safeToYear, selectedGenres, selectedLocations])

    const apiErrorHint =
        apiError && /500|network error/i.test(apiError) && import.meta.env.DEV
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
            limit: pageSize,
            tab,
        })
    }

    const handleSortChange = (nextSort: string) => {
        const safeSort = normalizeSort(nextSort)
        navigateWithFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: selectedGenres,
            locations: selectedLocations,
            sort: safeSort,
            limit: pageSize,
            tab,
        })
    }

    const handleCardGenreClick = (genre: string) => {
        const nextGenre = normalizeGenreValue(genre)
        if (!nextGenre) {
            return
        }

        navigateWithFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: [nextGenre],
            locations: selectedLocations,
            sort,
            page: 1,
            limit: pageSize,
            tab,
        })
    }

    function normalizeGenreValue(value: string): string {
        const normalized = value.trim().toLowerCase()
        if (!normalized) {
            return ''
        }
        return GENRE_ALIASES[normalized] ?? normalized
    }

    const handleRemoveGenreChip = (genreToRemove: string) => {
        navigateWithFilters({
            query: query || undefined,
            yearFrom: safeFromYear,
            yearTo: safeToYear,
            genres: selectedGenres.filter((value) => value !== genreToRemove),
            locations: selectedLocations,
            sort,
            limit: pageSize,
            tab,
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
            limit: pageSize,
            tab,
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
            limit: pageSize,
            tab,
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
            label: getGenreLabel(value, searchMessages.genres),
            onRemove: () => handleRemoveGenreChip(value),
        })),
        ...selectedLocations.map((value) => ({
            key: `location-${value}`,
            label: getLocationLabel(value),
            onRemove: () => handleRemoveLocationChip(value),
        })),
        ...(safeFromYear > MIN_PERIOD_YEAR || safeToYear < MAX_PERIOD_YEAR
            ? [
                  {
                      key: 'period',
                      label: `${safeFromYear} - ${safeToYear}`,
                      onRemove: handleResetPeriodChip,
                  },
              ]
            : []),
    ]

    const locationSuggestions = useMemo(() => {
        const normalizedLocale = locale === 'en' ? 'en' : 'nl'
        const uniqueValues = new Set<string>()

        // 1. Add predefined aliases
        Object.values(LOCATION_ALIASES).forEach(v => uniqueValues.add(v))

        // 2. Add dynamically fetched halls from global DB list
        allAvailableHalls.forEach(hall => {
            const exists = Array.from(uniqueValues).some(v => v.toLowerCase() === hall.toLowerCase())
            if (!exists) uniqueValues.add(hall)
        })

        // 3. Add venues currently visible on cards
        apiEntries.forEach(entry => {
            if (entry.venue) {
                entry.venue.split(' • ').forEach(v => {
                    const trimmed = v.trim()
                    if (trimmed) {
                        const exists = Array.from(uniqueValues).some(uv => uv.toLowerCase() === trimmed.toLowerCase())
                        if (!exists) uniqueValues.add(trimmed)
                    }
                })
            }
        })

        return Array.from(uniqueValues).sort((a, b) =>
            a.localeCompare(b, normalizedLocale === 'nl' ? 'nl-BE' : 'en-GB', { sensitivity: 'base' }),
        )
    }, [allAvailableHalls, apiEntries, locale])

    const isBlogTab = tab === 'blogs'

    return (
        <section className="relative bg-surface-sunken">
                <div className="w-full md:flex md:items-stretch">
                    <div
                        aria-hidden="true"
                        className="hidden w-[max(1.5rem,calc((100vw-var(--layout-content-max-width))/2))] shrink-0 md:block"
                    />
                    <FilterPanel
                        className="hidden w-80 shrink-0 self-stretch rounded-2xl border border-border bg-surface-inset px-5 py-5 md:my-6 md:flex md:min-h-[calc(100vh-7rem)]"
                        locationSuggestions={locationSuggestions}
                    />

                    <div className="flex w-full items-start">
                        <div className="z-30 flex w-12 shrink-0 self-stretch justify-center border-r border-border bg-surface-inset md:hidden">
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

                        <div className="w-full px-4 py-6 md:py-8 md:pr-0 md:pl-0">
                            <div className="search-main-rail">
                            {isMobileFiltersOpen ? (
                                <>
                                    <button
                                        type="button"
                                        className="fixed inset-0 z-40 bg-black/35 md:hidden"
                                        aria-label={m.search.filterCloseOverlayLabel}
                                        onClick={() => setIsMobileFiltersOpen(false)}
                                    />
                                    <div className="fixed left-0 top-0 z-50 h-full w-[min(84vw,21rem)] overflow-y-auto border-r border-border bg-surface-inset px-4 py-5 md:hidden">
                                        <div className="mb-3 flex items-center justify-end">
                                            <button
                                                type="button"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border"
                                                onClick={() => setIsMobileFiltersOpen(false)}
                                                aria-label={m.search.filterCloseLabel}
                                            >
                                                <CloseIcon className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <FilterPanel
                                            className="pb-2"
                                            showSearch={false}
                                            shareLabel={shareCopied ? m.search.shareCopiedLabel : m.search.shareLabel}
                                            locationSuggestions={locationSuggestions}
                                            onShare={() => {
                                                void handleShare()
                                            }}
                                        />
                                    </div>
                                </>
                            ) : null}

                            <MobileSearchForm key={searchParams.toString()} className="mb-5 md:hidden" />

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h1 className="flex items-center gap-3 text-3xl leading-none text-foreground">
                                        <button
                                            type="button"
                                            onClick={() => navigateWithFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort, limit: pageSize, page: 1, tab: 'all' })}
                                            className={tab === 'all' ? 'underline decoration-accent decoration-2 underline-offset-4' : 'text-muted transition-colors hover:text-foreground'}
                                        >
                                            {m.search.allTab}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigateWithFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort, limit: pageSize, page: 1, tab: 'productions' })}
                                            className={tab === 'productions' ? 'underline decoration-accent decoration-2 underline-offset-4' : 'text-muted transition-colors hover:text-foreground'}
                                        >
                                            {m.search.productionsTab}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigateWithFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort, limit: pageSize, page: 1, tab: 'blogs' })}
                                            className={tab === 'blogs' ? 'underline decoration-accent decoration-2 underline-offset-4' : 'text-muted transition-colors hover:text-foreground'}
                                        >
                                            {m.search.blogTab}
                                        </button>
                                    </h1>
                                    <p className="mt-2 text-sm text-muted">
                                        <strong className="text-foreground">{totalResults}</strong> {m.search.resultsSuffix}
                                    </p>
                                </div>

                                {!isBlogTab ? (
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm text-muted">{m.search.sortLabel}</label>
                                        <select
                                            className="h-9 rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-all cursor-pointer duration-200 hover:border-accent/45 hover:text-accent"
                                            value={sort}
                                            onChange={(event) => handleSortChange(event.target.value)}
                                        >
                                            <option value="relevance">{m.search.sortDefault}</option>
                                            <option value="recent">{m.search.sortRecent}</option>
                                            <option value="oldest">{m.search.sortOldest}</option>
                                        </select>
                                        <select
                                            className="h-9 rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-all cursor-pointer duration-200 hover:border-accent/45 hover:text-accent"
                                            value={String(pageSize)}
                                            onChange={(event) => {
                                                const nextLimit = Number(event.target.value)
                                                navigateWithFilters({
                                                    query: query || undefined,
                                                    yearFrom: safeFromYear,
                                                    yearTo: safeToYear,
                                                    genres: selectedGenres,
                                                    locations: selectedLocations,
                                                    sort,
                                                    page: 1,
                                                    limit: nextLimit,
                                                    tab,
                                                })
                                            }}
                                            aria-label={m.search.resultsPerPageAriaLabel}
                                        >
                                            {PAGE_SIZE_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {`${option} ${m.search.resultsPerPageSuffix}`}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="group hidden h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm text-foreground transition-all cursor-pointer duration-200 hover:border-accent/45 hover:text-accent md:inline-flex"
                                            onClick={() => {
                                                void handleShare()
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                                                <circle cx="18" cy="5" r="3" />
                                                <circle cx="6" cy="12" r="3" />
                                                <circle cx="18" cy="19" r="3" />
                                                <path d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49" strokeLinecap="round" />
                                            </svg>
                                            <span>{shareCopied ? m.search.shareCopiedLabel : m.search.shareLabel}</span>
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                        {(isBlogTab ? filterChips.filter((chip) => chip.key === 'period') : filterChips).length > 0 ? (
                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                {(isBlogTab ? filterChips.filter((chip) => chip.key === 'period') : filterChips).map((chip) => (
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
                                <p>{`${m.search.loadErrorPrefix} ${apiError}`}</p>
                                {apiErrorHint ? <p>{apiErrorHint}</p> : null}
                            </div>
                        ) : isLoading ? (
                            <div className="mt-5 min-h-[260px] grid place-items-center">
                                <div className="w-full max-w-xl text-center">
                                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                                            <path d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-text-accent">{m.common.loading}</p>
                                    <p className="mt-2 text-base italic text-foreground">"{loadingQuote}"</p>
                                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
                                        <span className="inline-flex items-center gap-1.5" aria-hidden="true">
                                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
                                        </span>
                                        <span>{m.search.loadingStatusLabel}</span>
                                    </div>
                                </div>
                            </div>
                        ) : pageItems.length > 0 ? (
                            <div className="mt-5 grid items-stretch gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {pageItems.map((item) => (
                                    <SearchResultCard
                                        key={item.id}
                                        item={item}
                                        genreValue={item.genre}
                                        onTagClick={handleCardGenreClick}
                                        detailHref={ item.type === 'blog'
                                            ? withLocalePath('/blogs/' + item.id, locale)
                                            : withLocalePath('/archive/' + item.id, locale)
                                        }
                                    />
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
                </div>
        </section>
    )
}

function SearchPage() {
    return (
        <PublicLayout>
            <SearchPageContent />
        </PublicLayout>
    )
}

export default SearchPage
