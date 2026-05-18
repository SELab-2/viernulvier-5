import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, normalizeApiAssetUrl } from '../../api/client'
import { getActiveLocale, withLocalePath } from '../../i18n'
import type { Locale, Messages } from '../../i18n/types'
import { usePublicMessages } from './PublicMessagesContext'
import SearchResultCard, { type SearchResultItem } from './search/SearchResultCard'
import SectionTitle from './SectionTitle'

// Canonical values to match SearchPage logic
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
    created_at: string
    performer_type: string | null
    attendance_mode: string | null
    image_url?: string | null
    links?: {
        self: string
        events: string
        genres: string
        tags: string
        media_gallery: string | null
        review_gallery: string | null
        poster_gallery: string | null
    }
}

type CarouselMode = 'on-this-day' | 'fallback-recent'

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
    if (!text) return ''
    if (typeof text === 'string') return text
    const values = locale === 'en' ? [text.en, text.nl, text.fr] : [text.nl, text.en, text.fr]
    return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

function toPlainText(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
        const parsed = new DOMParser().parseFromString(trimmed, 'text/html')
        return (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim()
    }
    return trimmed.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getGenreLabel(value: string, genreLabels: Messages['search']['genres']): string {
    const index = CANONICAL_GENRE_VALUES.indexOf(value as (typeof CANONICAL_GENRE_VALUES)[number])
    return index >= 0 ? genreLabels[index] ?? value : value
}

function formatDate(value: Date | string, locale: Locale): string {
    const date = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date)
}

function mapProductionToCarouselItem(item: ProductionApiItem, locale: Locale, searchMessages: Messages['search']): SearchResultItem {
    const title = getLocalizedText(item.title, locale) || searchMessages.fallbackUntitled
    const excerptRaw =
        getLocalizedText(item.description_short, locale) ||
        getLocalizedText(item.description, locale) ||
        getLocalizedText(item.teaser, locale) ||
        title
    const excerpt = toPlainText(excerptRaw) || title

    const normalizedLocation = (item.attendance_mode ?? '').trim().toLowerCase()
    const hasConcreteAttendanceMode = normalizedLocation.length > 0 && normalizedLocation !== 'offline' && normalizedLocation !== 'online'
    const fallbackVenue = searchMessages.fallbackVenue
    const venue = hasConcreteAttendanceMode ? normalizedLocation : fallbackVenue
    const fallbackTag = searchMessages.fallbackTag

    return {
        id: item.id,
        tag: fallbackTag,
        date: formatDate(item.created_at, locale),
        title,
        excerpt,
        venue,
        imageUrl: normalizeApiAssetUrl(item.image_url),
    }
}

function prioritizeItemsWithImage(items: SearchResultItem[]): SearchResultItem[] {
    // Stable sort: items with image come first, but otherwise keep order
    return [...items].sort((a, b) => {
        if (a.imageUrl && !b.imageUrl) return -1
        if (!a.imageUrl && b.imageUrl) return 1
        return 0
    })
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
                        const galleryRes = await apiFetch<{ data: { links: { items: string } } }>(galleryPath)
                        const itemsPath = getRelativePath(galleryRes.data?.links?.items)
                        if (!itemsPath) return null
                        const itemsRes = await apiFetch<{ data: Array<{ links?: { crops: string } }> }>(itemsPath)
                        for (const galleryItem of (itemsRes.data || [])) {
                            if (!galleryItem.links?.crops) continue
                            const cropsPath = getRelativePath(galleryItem.links.crops)
                            const cropsRes = await apiFetch<{ data: Array<{ name: string, url: string }> }>(cropsPath!)
                            const target = cropsRes.data.find(c => c.name === 'FE3_header') || cropsRes.data.find(c => c.name === 'FEA_boxed') || cropsRes.data[0]
                            if (target?.url) return { id: item.id, url: target.url }
                        }
                    } catch { return null }
                    return null
                })
            )
            const newImages: Record<string, string> = {}
            results.forEach(res => { if (res.status === 'fulfilled' && res.value) newImages[res.value.id] = res.value.url })
            setImages(prev => ({ ...prev, ...newImages }))
        }
        fetchImages()
    }, [items])
    return images
}

function useProductionEventDetails(items: ProductionApiItem[], locale: Locale, referenceDate?: string) {
    const [details, setDetails] = useState<Record<string, { date: string, venue: string }>>({})
    useEffect(() => {
        const fetchDetails = async () => {
            const itemsToFetch = items.filter(item => item.links?.events)
            if (itemsToFetch.length === 0) return
            const now = new Date()
            const refDateObj = referenceDate ? new Date(`${referenceDate}T00:00:00.000Z`) : null
            const results = await Promise.allSettled(
                itemsToFetch.map(async (item) => {
                    try {
                        const eventsPath = getRelativePath(item.links?.events)
                        const res = await apiFetch<{ data: Array<{ starts_at: string, links: { hall: string } }> }>(`${eventsPath}&limit=50`)
                        const pastEvents = (res.data || []).filter(e => new Date(e.starts_at) < now).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
                        if (pastEvents.length === 0) return { id: item.id, date: '', venue: '' }
                        let displayDate = ''
                        const otdMatch = refDateObj ? pastEvents.find(e => {
                            const d = new Date(e.starts_at)
                            return d.getUTCMonth() === refDateObj.getUTCMonth() && d.getUTCDate() === refDateObj.getUTCDate()
                        }) : null
                        if (otdMatch) displayDate = formatDate(otdMatch.starts_at, locale)
                        else if (pastEvents.length === 1) displayDate = formatDate(pastEvents[0].starts_at, locale)
                        else {
                            const y1 = new Date(pastEvents[0].starts_at).getFullYear()
                            const y2 = new Date(pastEvents[pastEvents.length - 1].starts_at).getFullYear()
                            displayDate = y1 === y2 ? `${formatDate(pastEvents[0].starts_at, locale)} - ${formatDate(pastEvents[pastEvents.length - 1].starts_at, locale)}` : `${y1} - ${y2}`
                        }
                        const vNames = new Set<string>()
                        for (const e of pastEvents.slice(0, 3)) {
                            const hPath = getRelativePath(e.links?.hall)
                            if (hPath) {
                                const hRes = await apiFetch<{ data: { name: LocalizedText } }>(hPath)
                                if (hRes.data?.name) vNames.add(getLocalizedText(hRes.data.name, locale))
                            }
                        }
                        return { id: item.id, date: displayDate, venue: Array.from(vNames).join(' • ') }
                    } catch { return null }
                })
            )
            const newDetails: Record<string, { date: string, venue: string }> = {}
            results.forEach(res => { if (res.status === 'fulfilled' && res.value) newDetails[res.value.id] = res.value })
            setDetails(prev => ({ ...prev, ...newDetails }))
        }
        fetchDetails()
    }, [items, locale, referenceDate])
    return details
}

function useProductionTaxonomies(items: ProductionApiItem[], locale: Locale, genreLabels: Messages['search']['genres']) {
    const [taxonomies, setTaxonomies] = useState<Record<string, string>>({})
    useEffect(() => {
        const fetchTaxonomies = async () => {
            const itemsToFetch = items.filter(item => item.links?.genres || item.links?.tags)
            if (itemsToFetch.length === 0) return
            const results = await Promise.allSettled(
                itemsToFetch.map(async (item) => {
                    try {
                        const gPath = getRelativePath(item.links?.genres)
                        if (gPath) {
                            const res = await apiFetch<{ data: Array<{ slug: LocalizedText, name: LocalizedText }> }>(gPath)
                            if (res.data?.[0]) {
                                const slug = getLocalizedText(res.data[0].slug, locale) || getLocalizedText(res.data[0].name, locale)
                                if (slug) return { id: item.id, label: getGenreLabel(slug.toLowerCase(), genreLabels) }
                            }
                        }
                        const tPath = getRelativePath(item.links?.tags)
                        if (tPath) {
                            const res = await apiFetch<{ data: Array<{ slug: LocalizedText, name: LocalizedText }> }>(tPath)
                            if (res.data?.[0]) {
                                const slug = getLocalizedText(res.data[0].slug, locale) || getLocalizedText(res.data[0].name, locale)
                                if (slug) return { id: item.id, label: getGenreLabel(slug.toLowerCase(), genreLabels) }
                            }
                        }
                        return { id: item.id, label: '' }
                    } catch { return null }
                })
            )
            const newT = {} as Record<string, string>
            results.forEach(res => { if (res.status === 'fulfilled' && res.value) newT[res.value.id] = res.value.label })
            setTaxonomies(prev => ({ ...prev, ...newT }))
        }
        fetchTaxonomies()
    }, [items, locale, genreLabels])
    return taxonomies
}

function PublicCarousel() {
    const locale = getActiveLocale(window.location.pathname)
    const messages = usePublicMessages()
    const [apiRawItems, setApiRawItems] = useState<ProductionApiItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<CarouselMode>('on-this-day')
    const scrollerRef = useRef<HTMLDivElement | null>(null)

    const referenceDate = useMemo(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    }, [])

    const fetchedImages = useProductionImages(apiRawItems)
    const fetchedDetails = useProductionEventDetails(apiRawItems, locale, mode === 'on-this-day' ? referenceDate : undefined)
    const fetchedTaxonomies = useProductionTaxonomies(apiRawItems, locale, messages.search.genres)

    // Fix: Force scroll to start when new items arrive
    useEffect(() => {
        if (scrollerRef.current && apiRawItems.length > 0) {
            scrollerRef.current.scrollLeft = 0
        }
    }, [apiRawItems])

    useEffect(() => {
        const abortController = new AbortController()
        const load = async () => {
            setIsLoading(true); setError(null); setApiRawItems([])
            const fetchR = async (otd: boolean) => {
                const p = new URLSearchParams({ page: '1', limit: '12', lang: locale, ...(otd ? { onThisDay: 'true', referenceDate, sort: 'oldest' } : { sort: 'recent' }) })
                const res = await apiFetch<PaginatedApiResponse<ProductionApiItem>>(`/archive/productions?${p.toString()}`, { signal: abortController.signal })
                return res.data
            }
            try {
                const otdData = await fetchR(true)
                if (otdData.length > 0) { setMode('on-this-day'); setApiRawItems(otdData) }
                else { setMode('fallback-recent'); setApiRawItems(await fetchR(false)) }
            } catch (err) { if (!abortController.signal.aborted) setError(err instanceof Error ? err.message : 'Error') }
            finally { if (!abortController.signal.aborted) setIsLoading(false) }
        }
        load()
        return () => abortController.abort()
    }, [locale, referenceDate])

    const carouselItems = useMemo(() => {
        const mapped = apiRawItems.map((item): SearchResultItem => {
            const base = mapProductionToCarouselItem(item, locale, messages.search)
            const detail = fetchedDetails[item.id]
            const taxonomy = fetchedTaxonomies[item.id]
            return {
                ...base,
                imageUrl: fetchedImages[item.id] || base.imageUrl,
                date: (detail?.date && detail.date !== '') ? detail.date : base.date,
                venue: (detail?.venue && detail.venue !== '') ? detail.venue : base.venue,
                tag: (taxonomy && taxonomy !== '') ? taxonomy : base.tag
            }
        })
        return prioritizeItemsWithImage(mapped)
    }, [apiRawItems, fetchedImages, fetchedDetails, fetchedTaxonomies, locale, messages.search])

    const scroll = (d: -1 | 1) => scrollerRef.current?.scrollBy({ left: d * scrollerRef.current.clientWidth * 0.9, behavior: 'smooth' })
    const heading = mode === 'fallback-recent' ? messages.home.onThisDayFallbackHeading : messages.home.onThisDayHeading

    return (
        <section className="bg-foreground/3 py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex flex-col items-start md:block">
                    <SectionTitle title={heading} subtitle={messages.home.onThisDaySubheading} />
                    <Link to={withLocalePath('/zoeken', locale)} className="mt-2 text-lg font-semibold text-foreground transition-opacity hover:opacity-70 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 sm:mt-0">
                        {messages.home.onThisDayViewAll} →
                    </Link>
                </div>
                {isLoading && <p className="mt-8 text-sm text-muted">{messages.common.loading}</p>}
                {!isLoading && (error || carouselItems.length === 0) && <p className="mt-8 text-sm text-muted">{messages.home.onThisDayEmpty}</p>}
                {!isLoading && carouselItems.length > 0 && (
                    <>
                        <div
                            ref={scrollerRef}
                            className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto py-6 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {carouselItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`relative flex flex-col w-[280px] shrink-0 snap-start border border-border bg-surface p-4 transition-transform duration-300 hover:rotate-0 hover:shadow-lg sm:w-[310px] ${index % 2 === 0 ? '-rotate-3' : 'rotate-3'}`}
                                >
                                    <SearchResultCard item={{ ...item, detailHref: withLocalePath(`/archive/${item.id}`, locale) }} />
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex items-center justify-end gap-4 text-2xl text-foreground">
                            <button type="button" className="h-10 w-10 rounded-full border border-border transition-colors hover:bg-surface" onClick={() => scroll(-1)}>‹</button>
                            <button type="button" className="h-10 w-10 rounded-full border border-border transition-colors hover:bg-surface" onClick={() => scroll(1)}>›</button>
                        </div>
                    </>
                )}

            </div>
        </section>
    )
}

export default PublicCarousel
