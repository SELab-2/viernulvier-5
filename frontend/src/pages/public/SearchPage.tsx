import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
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
}

const DEFAULT_PAGE_SIZE = 12
const PAGE_SIZE_OPTIONS = [12, 24, 48] as const
const MIN_PERIOD_YEAR = 1982
const MAX_PERIOD_YEAR = 2026

const CANONICAL_GENRE_VALUES = ['theater', 'dans', 'muziek', 'voorstelling', 'komedie', 'workshop'] as const
const CANONICAL_LOCATION_VALUES = ['theaterzaal', 'balzaal', 'domzaal'] as const

const GENRE_ALIASES: Record<string, string> = {
    theatre: 'theater',
    dance: 'dans',
    music: 'muziek',
    performance: 'voorstelling',
    comedy: 'komedie',
    workshop: 'workshop',
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
} | null

type ProductionApiItem = {
    id: string
    title: LocalizedText
    teaser: LocalizedText
    description_short: LocalizedText
    description: LocalizedText
    image_url?: string | null
    venue_name?: string | null
    venue_names?: string[]
    production_genres?: string[]
    performer_type: string | null
    attendance_mode: string | null
    created_at: string
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

function toPlainText(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) {
        return ''
    }

    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
        const parsed = new DOMParser().parseFromString(trimmed, 'text/html')
        return (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim()
    }

    return trimmed
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim()
}

function mapProductionToSearchEntry(item: ProductionApiItem, locale: Locale): SearchEntry {
    const title = getLocalizedText(item.title, locale) || (locale === 'nl' ? 'Zonder titel' : 'Untitled')
    const excerptRaw =
        getLocalizedText(item.description_short, locale) ||
        getLocalizedText(item.description, locale) ||
        getLocalizedText(item.teaser, locale) ||
        title
    const excerpt = toPlainText(excerptRaw) || title
    const createdDate = new Date(item.created_at)
    const year = Number.isNaN(createdDate.getTime()) ? MIN_PERIOD_YEAR : createdDate.getFullYear()
    const primaryProductionGenre = (item.production_genres ?? []).find(
        (value) => typeof value === 'string' && value.trim().length > 0,
    )
    const normalizedGenre = (primaryProductionGenre ?? item.performer_type ?? '').trim().toLowerCase()
    const normalizedLocation = (item.attendance_mode ?? '').trim().toLowerCase()
    const hasConcreteAttendanceMode = normalizedLocation.length > 0 && normalizedLocation !== 'offline' && normalizedLocation !== 'online'
    const eventVenues = (item.venue_names ?? []).map((value) => value.trim()).filter((value) => value.length > 0)
    const venueFromEvents = eventVenues.length > 0 ? eventVenues.join(' • ') : ''
    const fallbackVenue = locale === 'nl' ? 'Locatie nog niet bekend' : 'Venue to be announced'
    const venue = venueFromEvents || (item.venue_name ?? '').trim() || (hasConcreteAttendanceMode ? normalizedLocation : fallbackVenue)

    return {
        id: item.id,
        tag: normalizedGenre || (locale === 'nl' ? 'productie' : 'production'),
        date: formatDate(item.created_at, locale),
        title,
        excerpt,
        venue,
        imageUrl: item.image_url ?? undefined,
        year,
        genre: normalizedGenre,
        location: normalizedLocation,
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

function getGenreLabel(value: string, locale: Locale): string {
    const labels = getMessages(locale).search.genres
    const index = CANONICAL_GENRE_VALUES.indexOf(value as (typeof CANONICAL_GENRE_VALUES)[number])
    return index >= 0 ? labels[index] ?? value : value
}

function getLocationLabel(value: string, locale: Locale): string {
    const labels = getMessages(locale).search.locations
    const index = CANONICAL_LOCATION_VALUES.indexOf(value as (typeof CANONICAL_LOCATION_VALUES)[number])
    return index >= 0 ? labels[index] ?? value : value
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
    const limitParam = Number(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE))
    const safeLimit = PAGE_SIZE_OPTIONS.includes(limitParam as (typeof PAGE_SIZE_OPTIONS)[number]) ? limitParam : DEFAULT_PAGE_SIZE
    const sliderRef = useRef<HTMLDivElement | null>(null)

    const [searchInput, setSearchInput] = useState(query)

    useEffect(() => {
        setSearchInput(query)
    }, [query])

    const pushFilters = (filters: { query?: string; yearFrom?: number; yearTo?: number; genres?: string[]; locations?: string[]; sort?: string; limit?: number }) => {
        const params = new URLSearchParams()
        if (filters.query) params.set('q', filters.query)
        if (filters.yearFrom && filters.yearFrom > MIN_PERIOD_YEAR) params.set('yearFrom', String(filters.yearFrom))
        if (filters.yearTo && filters.yearTo < MAX_PERIOD_YEAR) params.set('yearTo', String(filters.yearTo))
        if (filters.genres && filters.genres.length > 0) params.set('genres', filters.genres.join(','))
        if (filters.locations && filters.locations.length > 0) params.set('locations', filters.locations.join(','))
        if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort)
        if (filters.limit && filters.limit !== DEFAULT_PAGE_SIZE) params.set('limit', String(filters.limit))
        const path = withLocalePath('/zoeken', locale)
        const qs = params.toString()
        navigate(qs ? `${path}?${qs}` : path)
        onAfterChange?.()
    }

    const handleSearchSubmit = () => {
        pushFilters({ query: searchInput.trim() || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort, limit: safeLimit })
    }

    const handleGenreChange = (next: string) => {
        const nextGenres = selectedGenres.includes(next)
            ? selectedGenres.filter((value) => value !== next)
            : [...selectedGenres, next]

        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: nextGenres, locations: selectedLocations, sort, limit: safeLimit })
    }

    const handleLocationChange = (next: string) => {
        const nextLocations = selectedLocations.includes(next)
            ? selectedLocations.filter((value) => value !== next)
            : [...selectedLocations, next]

        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: nextLocations, sort, limit: safeLimit })
    }

    const handleFromYearChange = (next: number) => {
        const clampedNext = Math.min(next, safeToYear)
        pushFilters({ query: query || undefined, yearFrom: clampedNext, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort, limit: safeLimit })
    }

    const handleToYearChange = (next: number) => {
        const clampedNext = Math.max(next, safeFromYear)
        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: clampedNext, genres: selectedGenres, locations: selectedLocations, sort, limit: safeLimit })
    }

    const handleReset = () => {
        pushFilters({ yearFrom: MIN_PERIOD_YEAR, yearTo: MAX_PERIOD_YEAR, sort, limit: safeLimit })
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
    const locationOptions = s.locations.map((label, index) => ({
        label,
        value: CANONICAL_LOCATION_VALUES[index] ?? label.toLowerCase(),
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

            <div className="mt-6 border-t border-border pt-5 pb-5">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-foreground">{s.locationLabel}</h3>
                <div className="mt-4 space-y-2 text-sm text-text-accent">
                    {locationOptions.map(({ label, value }) => {
                        return (
                            <label key={value} className="flex items-center gap-2.5 text-foreground/90 transition-all duration-200 hover:translate-x-0.5 hover:text-foreground cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedLocations.includes(value)}
                                    onChange={() => handleLocationChange(value)}
                                    className="filter-checkbox cursor-pointer"
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
                    className="h-10 w-full rounded-full border border-border bg-surface px-4 pr-10 text-sm text-foreground"
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
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [apiError, setApiError] = useState<string | null>(null)

    const query = (searchParams.get('q') ?? '').trim()
    const genresParamValue = (searchParams.get('genres') ?? '').trim().toLowerCase()
    const legacyGenreValue = (searchParams.get('genre') ?? '').trim().toLowerCase()
    const locationsParamValue = (searchParams.get('locations') ?? '').trim().toLowerCase()
    const legacyLocationValue = (searchParams.get('location') ?? '').trim().toLowerCase()
    const legacyYear = Number(searchParams.get('year') ?? String(MAX_PERIOD_YEAR))
    const yearFromParam = Number(searchParams.get('yearFrom') ?? String(MIN_PERIOD_YEAR))
    const yearToParam = Number(searchParams.get('yearTo') ?? String(Number.isFinite(legacyYear) ? legacyYear : MAX_PERIOD_YEAR))
    const periodFromYear = Number.isFinite(yearFromParam) ? Math.min(MAX_PERIOD_YEAR, Math.max(MIN_PERIOD_YEAR, yearFromParam)) : MIN_PERIOD_YEAR
    const periodToYear = Number.isFinite(yearToParam) ? Math.min(MAX_PERIOD_YEAR, Math.max(MIN_PERIOD_YEAR, yearToParam)) : MAX_PERIOD_YEAR
    const safeFromYear = Math.min(periodFromYear, periodToYear)
    const safeToYear = Math.max(periodFromYear, periodToYear)
    const selectedGenres = useMemo(() => {
        if (genresParamValue) {
            return genresParamValue
                .split(',')
                .map((value) => GENRE_ALIASES[value.trim()] ?? value.trim())
                .filter(Boolean)
        }

        return legacyGenreValue ? [GENRE_ALIASES[legacyGenreValue] ?? legacyGenreValue] : []
    }, [genresParamValue, legacyGenreValue])

    const selectedLocations = useMemo(() => {
        if (locationsParamValue) {
            return locationsParamValue
                .split(',')
                .map((value) => LOCATION_ALIASES[value.trim()] ?? value.trim())
                .filter(Boolean)
        }

        return legacyLocationValue ? [LOCATION_ALIASES[legacyLocationValue] ?? legacyLocationValue] : []
    }, [locationsParamValue, legacyLocationValue])
    const sortParam = (searchParams.get('sort') ?? 'relevance').trim().toLowerCase()
    const sort = sortParam === 'recent' || sortParam === 'oldest' || sortParam === 'relevance' ? sortParam : 'relevance'
    const pageParam = Number(searchParams.get('page') ?? '1')
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    const limitParam = Number(searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE))
    const pageSize = PAGE_SIZE_OPTIONS.includes(limitParam as (typeof PAGE_SIZE_OPTIONS)[number]) ? limitParam : DEFAULT_PAGE_SIZE

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
                })

                if (query) {
                    params.set('search', query)
                }

                if (selectedGenres.length > 0) {
                    params.set('genres', selectedGenres.join(','))
                }

                if (selectedLocations.length > 0) {
                    params.set('locations', selectedLocations.join(','))
                }

                if (safeFromYear > MIN_PERIOD_YEAR) {
                    params.set('yearFrom', String(safeFromYear))
                }

                if (safeToYear < MAX_PERIOD_YEAR) {
                    params.set('yearTo', String(safeToYear))
                }

                if (sort === 'recent' || sort === 'oldest') {
                    params.set('sort', sort)
                }

                const response = await apiFetch<PaginatedApiResponse<ProductionApiItem>>(
                    `/v1/archive/productions?${params.toString()}`,
                    { signal: abortController.signal }
                )

                const mappedEntries = response.data.map((item) => mapProductionToSearchEntry(item, locale))
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
    }, [query, locale, selectedGenres, selectedLocations, safeFromYear, safeToYear, sort, page, pageSize])

    const navigateWithFilters = (filters: {
        query?: string
        yearFrom?: number
        yearTo?: number
        genres?: string[]
        locations?: string[]
        sort?: string
        page?: number
        limit?: number
    }) => {
        const params = new URLSearchParams()
        if (filters.query) params.set('q', filters.query)
        if (filters.yearFrom && filters.yearFrom > MIN_PERIOD_YEAR) params.set('yearFrom', String(filters.yearFrom))
        if (filters.yearTo && filters.yearTo < MAX_PERIOD_YEAR) params.set('yearTo', String(filters.yearTo))
        if (filters.genres && filters.genres.length > 0) params.set('genres', filters.genres.join(','))
        if (filters.locations && filters.locations.length > 0) params.set('locations', filters.locations.join(','))
        if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort)
        if (filters.page && filters.page > 1) params.set('page', String(filters.page))
        if (filters.limit && filters.limit !== DEFAULT_PAGE_SIZE) params.set('limit', String(filters.limit))
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
            limit: pageSize,
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
            limit: pageSize,
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
            label: getGenreLabel(value, locale),
            onRemove: () => handleRemoveGenreChip(value),
        })),
        ...selectedLocations.map((value) => ({
            key: `location-${value}`,
            label: getLocationLabel(value, locale),
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

    return (
        <PublicLayout>
            <section className="relative bg-surface-sunken">
                <div className="w-full md:flex md:items-stretch">
                    <div
                        aria-hidden="true"
                        className="hidden w-[max(1.5rem,calc((100vw-var(--layout-content-max-width))/2))] shrink-0 md:block"
                    />
                    <FilterPanel className="hidden w-80 shrink-0 self-stretch rounded-2xl border border-border bg-surface-inset px-5 py-5 md:my-6 md:flex md:min-h-[calc(100vh-7rem)]" />

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
                                        <strong className="text-foreground">{totalResults}</strong> {m.search.resultsSuffix}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-muted">{m.search.sortLabel}</label>
                                    <select
                                        className="h-9 rounded-full border border-border bg-surface px-4 text-sm text-foreground transition-all cursor-pointer duration-200 hover:border-accent/45 hover:text-accent"
                                        value={sort}
                                        onChange={(event) => handleSortChange(event.target.value)}
                                    >
                                        <option value="relevance">{m.search.sortDefault}</option>
                                        <option value="recent">{locale === 'nl' ? 'Recentste eerst' : 'Newest first'}</option>
                                        <option value="oldest">{locale === 'nl' ? 'Oudste eerst' : 'Oldest first'}</option>
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
                                            })
                                        }}
                                        aria-label={locale === 'nl' ? 'Resultaten per pagina' : 'Results per page'}
                                    >
                                        {PAGE_SIZE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {locale === 'nl' ? `${option} per pagina` : `${option} per page`}
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
                            <div className="mt-5 grid gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
                </div>
            </section>
        </PublicLayout>
    )
}

export default SearchPage
