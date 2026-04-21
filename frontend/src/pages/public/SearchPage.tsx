import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
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
const SEARCH_INPUT_DEBOUNCE_MS = 250

const CANONICAL_GENRE_VALUES = [
    'theater',
    'dans',
    'concert',
    'nightlife',
    'talks',
    'comedy',
    'monument',
    'circus',
    'performance',
    'spoken word',
    'listening session',
] as const

const GENRE_ALIASES: Record<string, string> = {
    theater: 'theater',
    theatre: 'theater',
    dans: 'dans',
    dance: 'dans',
    music: 'concert',
    komedie: 'comedy',
    voorstelling: 'performance',
    'spoken-word': 'spoken word',
}

const NON_GENRE_TAG_VALUES = new Set([
    'group',
    'in de vooruit',
    'by viernulvier',
    'te gast',
    'nederlands gesproken',
    'engels gesproken',
    'frans gesproken',
    'cadeaubon geldig',
])

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
    links?: {
        self: string
        events: string
        genres: string
        tags: string
        media_gallery: string | null
        review_gallery: string | null
        poster_gallery: string | null
        uitdatabank_theme: string | null
        uitdatabank_type: string | null
    }
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
}

function getLocalizedText(text: LocalizedText, locale: Locale): string {
    if (!text) {
        return ''
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

    return {
        query,
        yearFrom,
        yearTo,
        genres: parseSelectedGenres(searchParams),
        locations: parseSelectedLocations(searchParams),
        sort,
        page,
        limit,
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

    return params
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

    if (!/[<&]/.test(trimmed)) {
        return trimmed.replace(/\s+/g, ' ').trim()
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

function normalizeGenreValue(value: string): string {
    const normalized = value.trim().toLowerCase()
    if (!normalized) {
        return ''
    }

    return GENRE_ALIASES[normalized] ?? normalized
}

function mapProductionToSearchEntry(item: ProductionApiItem, locale: Locale, preferredGenre?: string): SearchEntry {
    const searchMessages = getMessages(locale).search
    const title = getLocalizedText(item.title, locale) || searchMessages.fallbackUntitled
    const excerptRaw =
        getLocalizedText(item.description_short, locale) ||
        getLocalizedText(item.description, locale) ||
        getLocalizedText(item.teaser, locale) ||
        title
    const excerpt = toPlainText(excerptRaw) || title
    const createdDate = new Date(item.created_at)
    const year = Number.isNaN(createdDate.getTime()) ? MIN_PERIOD_YEAR : createdDate.getFullYear()
    const normalizedProductionGenres = (item.production_genres ?? [])
        .map((value) => normalizeGenreValue(value))
        .filter((value) => value.length > 0 && !NON_GENRE_TAG_VALUES.has(value))

    const normalizedPerformerType = normalizeGenreValue(item.performer_type ?? '')
    const fallbackPerformerTag = normalizedPerformerType.length > 0 && normalizedPerformerType !== 'group'
        ? normalizedPerformerType
        : ''

    const normalizedPreferredGenre = preferredGenre?.trim().toLowerCase() ?? ''
    const matchedPreferredGenre = normalizedPreferredGenre
        ? normalizedProductionGenres.find((genre) => {
              if (genre === normalizedPreferredGenre) {
                  return true
              }

              if (normalizedPreferredGenre === 'dans' && genre === 'dance') {
                  return true
              }

              if (normalizedPreferredGenre === 'theater' && genre === 'theatre') {
                  return true
              }

              return false
          })
        : undefined

    const normalizedGenre = matchedPreferredGenre ?? normalizedProductionGenres[0] ?? fallbackPerformerTag
    const normalizedLocation = (item.attendance_mode ?? '').trim().toLowerCase()
    const hasConcreteAttendanceMode = normalizedLocation.length > 0 && normalizedLocation !== 'offline' && normalizedLocation !== 'online'
    const eventVenues = (item.venue_names ?? []).map((value) => value.trim()).filter((value) => value.length > 0)
    const venueFromEvents = eventVenues.length > 0 ? eventVenues.join(' • ') : ''
    const fallbackVenue = searchMessages.fallbackVenue
    const venue = venueFromEvents || (item.venue_name ?? '').trim() || (hasConcreteAttendanceMode ? normalizedLocation : fallbackVenue)

    return {
        id: item.id,
        tag: normalizedGenre ? getGenreLabel(normalizedGenre, locale) : searchMessages.fallbackTag,
        date: formatDate(item.created_at, locale),
        title,
        excerpt,
        venue,
        imageUrl: item.image_url ?? undefined,
        year,
        genre: normalizedGenre || '',
        location: normalizedLocation,
    }
}

function getRelativePath(url: string | null | undefined): string | null {
    if (!url) return null
    const parts = url.split('/api/v1')
    return parts.length > 1 ? parts[1] : url
}

function useProductionImages(items: ProductionApiItem[]) {
    const [images, setImages] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchImages = async () => {
            const itemsToFetch = items.filter(item => !item.image_url && item.links?.media_gallery)
            
            if (itemsToFetch.length === 0) return

            const results = await Promise.allSettled(
                itemsToFetch.map(async (item) => {
                    const galleryPath = getRelativePath(item.links?.media_gallery)
                    if (!galleryPath) return null

                    try {
                        // 1. Production -> Gallery
                        const galleryRes = await apiFetch<{ data: { links: { items: string } } }>(galleryPath)
                        const itemsPath = getRelativePath(galleryRes.data?.links?.items)
                        if (!itemsPath) return null

                        // 2. Gallery -> Items
                        const itemsRes = await apiFetch<{ data: any[] }>(itemsPath)
                        const galleryItems = itemsRes.data || []
                        
                        // 3. Find first item with crops
                        for (const galleryItem of galleryItems) {
                            if (!galleryItem.links?.crops) continue
                            
                            // 4. Item -> Crops
                            const cropsPath = getRelativePath(galleryItem.links.crops)
                            if (!cropsPath) continue
                            const cropsRes = await apiFetch<{ data: any[] }>(cropsPath)
                            const crops = cropsRes.data || []
                            
                            // 5. Find target crop
                            const targetCrop = crops.find((c: any) => c.name === 'FE3_header') || 
                                             crops.find((c: any) => c.name === 'FE3_grid') || 
                                             crops[0]
                            
                            if (targetCrop?.url) {
                                return { id: item.id, url: targetCrop.url }
                            }
                        }
                    } catch (err) {
                        // Silently fail
                    }
                    return null
                })
            )

            const newImages: Record<string, string> = {}
            results.forEach(res => {
                if (res.status === 'fulfilled' && res.value) {
                    newImages[res.value.id] = res.value.url
                }
            })
            setImages(prev => ({ ...prev, ...newImages }))
        }

        fetchImages()
    }, [items])

    return images
}

function useProductionEventDetails(items: ProductionApiItem[], locale: Locale) {
    const [details, setDetails] = useState<Record<string, { date: string, venue: string }>>({})

    useEffect(() => {
        const fetchDetails = async () => {
            const itemsToFetch = items.filter(item => item.links?.events)
            if (itemsToFetch.length === 0) return

            const now = new Date()
            const results = await Promise.allSettled(
                itemsToFetch.map(async (item) => {
                    try {
                        const eventsPath = getRelativePath(item.links?.events)
                        if (!eventsPath) return null

                        // 1. Fetch events
                        const res = await apiFetch<{ data: Array<{ starts_at: string, links: { hall: string } }> }>(`${eventsPath}&limit=50`)
                        const pastEvents = (res.data || [])
                            .filter(e => new Date(e.starts_at) < now)
                            .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

                        if (pastEvents.length === 0) return { id: item.id, date: '', venue: '' }

                        // 2. Format Date
                        const formatDateLocal = (dateStr: string) => {
                            const date = new Date(dateStr)
                            return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                            }).format(date)
                        }

                        let displayDate = ''
                        if (pastEvents.length === 1) {
                            displayDate = formatDateLocal(pastEvents[0].starts_at)
                        } else {
                            const firstYear = new Date(pastEvents[0].starts_at).getFullYear()
                            const lastYear = new Date(pastEvents[pastEvents.length - 1].starts_at).getFullYear()
                            displayDate = firstYear === lastYear 
                                ? `${formatDateLocal(pastEvents[0].starts_at)} - ${formatDateLocal(pastEvents[pastEvents.length - 1].starts_at)}`
                                : `${firstYear} - ${lastYear}`
                        }

                        // 3. Fetch Venue Names (Halls)
                        const venueNames = new Set<string>()
                        const hallResults = await Promise.allSettled(
                            pastEvents.slice(0, 5).map(async (event) => {
                                const hallPath = getRelativePath(event.links?.hall)
                                if (!hallPath) return null
                                const hallRes = await apiFetch<{ data: { name: LocalizedText } }>(hallPath)
                                return getLocalizedText(hallRes.data.name, locale)
                            })
                        )

                        hallResults.forEach(hr => {
                            if (hr.status === 'fulfilled' && hr.value) {
                                venueNames.add(hr.value)
                            }
                        })

                        const displayVenue = Array.from(venueNames).join(' • ')

                        return { id: item.id, date: displayDate, venue: displayVenue }
                    } catch (err) {
                        return null
                    }
                })
            )

            const newDetails: Record<string, { date: string, venue: string }> = {}
            results.forEach(res => {
                if (res.status === 'fulfilled' && res.value) {
                    newDetails[res.value.id] = { date: res.value.date, venue: res.value.venue }
                }
            })
            setDetails(prev => ({ ...prev, ...newDetails }))
        }

        fetchDetails()
    }, [items, locale])

    return details
}

function useProductionTaxonomies(items: ProductionApiItem[], locale: Locale) {
    const [taxonomies, setTaxonomies] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchTaxonomies = async () => {
            const itemsToFetch = items.filter(item => item.links?.genres || item.links?.tags)
            if (itemsToFetch.length === 0) return

            const results = await Promise.allSettled(
                itemsToFetch.map(async (item) => {
                    try {
                        // 1. Try Genres
                        const genresPath = getRelativePath(item.links?.genres)
                        if (genresPath) {
                            const res = await apiFetch<{ data: Array<{ slug: LocalizedText, name: LocalizedText }> }>(genresPath)
                            const firstGenre = res.data?.[0]
                            if (firstGenre) {
                                const label = getLocalizedText(firstGenre.slug, locale) || getLocalizedText(firstGenre.name, locale)
                                if (label) return { id: item.id, label }
                            }
                        }

                        // 2. Fallback to Tags
                        const tagsPath = getRelativePath(item.links?.tags)
                        if (tagsPath) {
                            const res = await apiFetch<{ data: Array<{ slug: LocalizedText, name: LocalizedText }> }>(tagsPath)
                            const firstTag = res.data?.[0]
                            if (firstTag) {
                                const label = getLocalizedText(firstTag.slug, locale) || getLocalizedText(firstTag.name, locale)
                                if (label) return { id: item.id, label }
                            }
                        }

                        return { id: item.id, label: '' }
                    } catch (err) {
                        return null
                    }
                })
            )

            const newTaxonomies: Record<string, string> = {}
            results.forEach(res => {
                if (res.status === 'fulfilled' && res.value) {
                    newTaxonomies[res.value.id] = res.value.label
                }
            })
            setTaxonomies(prev => ({ ...prev, ...newTaxonomies }))
        }

        fetchTaxonomies()
    }, [items, locale])

    return taxonomies
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
            } catch (err) {
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

function getGenreLabel(value: string, locale: Locale): string {
    const labels = getMessages(locale).search.genres
    const index = CANONICAL_GENRE_VALUES.indexOf(value as (typeof CANONICAL_GENRE_VALUES)[number])
    return index >= 0 ? labels[index] ?? value : value
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
    const { search: s } = getMessages(locale)

    const filterState = useMemo(() => parseSearchFilterState(searchParams), [searchParams])
    const query = filterState.query
    const safeFromYear = filterState.yearFrom
    const safeToYear = filterState.yearTo
    const selectedGenres = filterState.genres
    const selectedLocations = filterState.locations
    const sort = filterState.sort
    const safeLimit = filterState.limit
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
            })
        }, SEARCH_INPUT_DEBOUNCE_MS)

        return () => {
            window.clearTimeout(timerId)
        }
    }, [searchInput, query, safeFromYear, safeToYear, selectedGenres, selectedLocations, sort, safeLimit, pushFilters])

    const handleSearchSubmit = () => {
        pushFilters({ query: searchInput.trim() || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: selectedLocations, sort, limit: safeLimit })
    }

    const handleGenreChange = (next: string) => {
        const nextGenres = selectedGenres.includes(next) ? [] : [next]

        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: nextGenres, locations: selectedLocations, sort, limit: safeLimit })
    }

    const handleLocationChange = (next: string) => {
        const nextLocations = selectedLocations.includes(next)
            ? selectedLocations.filter((value) => value !== next)
            : [...selectedLocations, next]

        pushFilters({ query: query || undefined, yearFrom: safeFromYear, yearTo: safeToYear, genres: selectedGenres, locations: nextLocations, sort, limit: safeLimit })
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
        })
        setLocationInput('')
        setIsLocationSuggestionsOpen(false)
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
                                    onClick={() => handleLocationChange(value)}
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
    const query = useMemo(() => parseSearchFilterState(searchParams).query, [searchParams])
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
    const [apiRawItems, setApiRawItems] = useState<ProductionApiItem[]>([])
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [apiError, setApiError] = useState<string | null>(null)

    const fetchedImages = useProductionImages(apiRawItems)
    const fetchedDetails = useProductionEventDetails(apiRawItems, locale)
    const fetchedTaxonomies = useProductionTaxonomies(apiRawItems, locale)
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

    useEffect(() => {
        const abortController = new AbortController()

        const loadSearchEntries = async () => {
            setIsLoading(true)
            setApiError(null)
            setApiRawItems([]) // Clear old data

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
                    `/archive/productions?${params.toString()}`,
                    { signal: abortController.signal }
                )

                const preferredGenre = selectedGenres.length === 1 ? selectedGenres[0] : undefined
                const mappedEntries = response.data.map((item) => mapProductionToSearchEntry(item, locale, preferredGenre))
                setApiRawItems(response.data)
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

    const navigateWithFilters = (filters: SearchFilterOverrides) => {
        const params = buildSearchParams(filters)
        const path = withLocalePath('/zoeken', locale)
        const qs = params.toString()
        navigate(qs ? `${path}?${qs}` : path)
    }

    const currentPage = Math.min(page, totalPages)
    const pageItems = useMemo(() => {
        if (!apiEntries) return []
        return apiEntries
            .map(item => {
                const detail = fetchedDetails[item.id]
                const fetchedTaxonomy = fetchedTaxonomies[item.id]
                return {
                    ...item,
                    imageUrl: fetchedImages[item.id] || item.imageUrl,
                    date: detail?.date !== undefined && detail.date !== '' ? detail.date : item.date,
                    venue: detail?.venue !== undefined && detail.venue !== '' ? detail.venue : item.venue,
                    tag: fetchedTaxonomy !== undefined && fetchedTaxonomy !== '' ? fetchedTaxonomy : item.tag
                }
            })
            .filter(item => fetchedDetails[item.id]?.date !== '')
    }, [apiEntries, fetchedImages, fetchedDetails, fetchedTaxonomies])

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

        // 3. Add venues currently visible on cards (ensures "De Vooruit - Café" etc. are always there)
        Object.values(fetchedDetails).forEach(detail => {
            if (detail.venue) {
                detail.venue.split(' • ').forEach(v => {
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
    }, [allAvailableHalls, fetchedDetails, locale])

    return (
        <PublicLayout>
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
