import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import type { Locale } from '../../i18n/types'
import SearchResultCard, { type SearchResultItem } from './search/SearchResultCard'

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
    on_this_day_event_date?: string | null
    image_url?: string | null
    venue_name?: string | null
    venue_names?: string[]
    production_genres?: string[]
    performer_type: string | null
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

function formatDate(value: Date, locale: Locale): string {
    return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(value)
}

function formatReferenceDate(value: Date): string {
    const year = String(value.getFullYear())
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function mapProductionToCarouselItem(item: ProductionApiItem, locale: Locale): SearchResultItem | null {
    const eventDate = item.on_this_day_event_date ? new Date(item.on_this_day_event_date) : null
    if (!eventDate) {
        return null
    }

    if (Number.isNaN(eventDate.getTime())) {
        return null
    }

    const title = getLocalizedText(item.title, locale) || (locale === 'nl' ? 'Zonder titel' : 'Untitled')
    const excerptRaw =
        getLocalizedText(item.description_short, locale) ||
        getLocalizedText(item.description, locale) ||
        getLocalizedText(item.teaser, locale) ||
        title
    const excerpt = toPlainText(excerptRaw) || title
    const fallbackVenue = locale === 'nl' ? 'Locatie nog niet bekend' : 'Venue to be announced'

    const venueFromProduction = (item.venue_names ?? []).find((value) => value.trim().length > 0) ?? item.venue_name ?? ''

    return {
        id: item.id,
        tag: (item.production_genres ?? []).find((value) => value.trim().length > 0) ?? item.performer_type?.trim() ?? (locale === 'nl' ? 'productie' : 'production'),
        date: formatDate(eventDate, locale),
        title,
        excerpt,
        venue: venueFromProduction || fallbackVenue,
        imageUrl: item.image_url ?? undefined,
    }
}

function PublicCarousel() {
    const locale = getActiveLocale(window.location.pathname)
    const messages = getMessages(locale)
    const [items, setItems] = useState<SearchResultItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const scrollerRef = useRef<HTMLDivElement | null>(null)
    const today = useMemo(() => new Date(), [])
    const referenceDate = useMemo(() => formatReferenceDate(today), [today])

    useEffect(() => {
        const abortController = new AbortController()

        const loadCarouselItems = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams({
                    page: '1',
                    limit: '100',
                    lang: locale,
                    onThisDay: 'true',
                    referenceDate,
                    sort: 'oldest',
                })

                const response = await apiFetch<PaginatedApiResponse<ProductionApiItem>>(
                    `/v1/archive/productions?${params.toString()}`,
                    { signal: abortController.signal },
                )

                const mappedItems = response.data
                    .map((item) => mapProductionToCarouselItem(item, locale))
                    .filter((item): item is SearchResultItem => item !== null)

                setItems(mappedItems)
                setActiveIndex(0)
            } catch (fetchError) {
                if (abortController.signal.aborted) {
                    return
                }

                const message = fetchError instanceof Error ? fetchError.message : 'Request failed'
                setError(message)
                setItems([])
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        void loadCarouselItems()

        return () => {
            abortController.abort()
        }
    }, [locale, referenceDate, today])

    const handleScroll = () => {
        const scroller = scrollerRef.current
        if (!scroller) {
            return
        }

        const cards = Array.from(scroller.children) as HTMLElement[]
        if (cards.length === 0) {
            setActiveIndex(0)
            return
        }

        const currentLeft = scroller.scrollLeft
        let nearestIndex = 0
        let nearestDistance = Number.POSITIVE_INFINITY

        cards.forEach((card, index) => {
            const distance = Math.abs(card.offsetLeft - currentLeft)
            if (distance < nearestDistance) {
                nearestDistance = distance
                nearestIndex = index
            }
        })

        setActiveIndex(nearestIndex)
    }

    const scrollByPage = (direction: -1 | 1) => {
        const scroller = scrollerRef.current
        if (!scroller) {
            return
        }

        scroller.scrollBy({
            left: direction * scroller.clientWidth * 0.9,
            behavior: 'smooth',
        })
    }

    return (
        <section className="bg-foreground/3 py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-4xl lowercase text-foreground sm:text-5xl">{messages.home.onThisDayHeading}</h2>
                        <p className="mt-2 text-lg text-muted">{messages.home.onThisDaySubheading}</p>
                    </div>
                    <Link
                        to={withLocalePath('/zoeken', locale)}
                        className="text-lg font-semibold text-foreground transition-opacity hover:opacity-70"
                    >
                        {messages.home.onThisDayViewAll} →
                    </Link>
                </div>

                {isLoading ? <p className="mt-8 text-sm text-muted">{messages.common.loading}</p> : null}
                {!isLoading && error ? <p className="mt-8 text-sm text-muted">{messages.home.onThisDayEmpty}</p> : null}
                {!isLoading && !error && items.length === 0 ? <p className="mt-8 text-sm text-muted">{messages.home.onThisDayEmpty}</p> : null}

                {!isLoading && !error && items.length > 0 ? (
                    <>
                        <div
                            ref={scrollerRef}
                            onScroll={handleScroll}
                            className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`flex w-[280px] shrink-0 snap-start border border-border bg-surface p-4 transition-transform duration-300 hover:rotate-0 hover:shadow-lg sm:w-[310px] ${
                                        index % 2 === 0 ? '-rotate-3' : 'rotate-3'
                                    }`}
                                >
                                    <SearchResultCard item={item} />
                                </div>
                            ))}
                        </div>

                        <div className="mt-2 flex items-center justify-end gap-4 text-2xl text-foreground">
                            <button
                                type="button"
                                className="h-10 w-10 rounded-full border border-border transition-colors hover:bg-surface"
                                onClick={() => scrollByPage(-1)}
                                aria-label="Previous"
                            >
                                ‹
                            </button>
                            <p className="text-lg text-foreground">
                                {Math.min(activeIndex + 1, items.length)} / {items.length}
                            </p>
                            <button
                                type="button"
                                className="h-10 w-10 rounded-full border border-border transition-colors hover:bg-surface"
                                onClick={() => scrollByPage(1)}
                                aria-label="Next"
                            >
                                ›
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    )
}

export default PublicCarousel
