import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import type { Locale } from '../../i18n/types'
import SearchResultCard, { type SearchResultItem } from './search/SearchResultCard'
import SectionTitle from './SectionTitle'

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
    created_at?: string
    on_this_day_event_date?: string | null
    image_url?: string | null
    venue_name?: string | null
    venue_names?: string[]
    production_genres?: string[]
    performer_type: string | null
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

function getDisplayTag(item: ProductionApiItem, locale: Locale): string {
    const normalizedProductionGenres = (item.production_genres ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .filter((value) => !NON_GENRE_TAG_VALUES.has(value.toLowerCase()))

    if (normalizedProductionGenres.length > 0) {
        return normalizedProductionGenres[0]
    }

    const normalizedPerformerType = item.performer_type?.trim() ?? ''
    if (normalizedPerformerType.length > 0 && !NON_GENRE_TAG_VALUES.has(normalizedPerformerType.toLowerCase())) {
        return normalizedPerformerType
    }

    return locale === 'nl' ? 'productie' : 'production'
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

function mapProductionToCarouselItem(item: ProductionApiItem, locale: Locale, mode: CarouselMode): SearchResultItem | null {
    const rawDate = mode === 'on-this-day'
        ? item.on_this_day_event_date
        : item.on_this_day_event_date ?? item.created_at

    if (!rawDate) {
        return null
    }

    const eventDate = new Date(rawDate)

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
        tag: getDisplayTag(item, locale),
        date: formatDate(eventDate, locale),
        title,
        excerpt,
        venue: venueFromProduction || fallbackVenue,
        imageUrl: item.image_url ?? undefined,
    }
}

function prioritizeItemsWithImage(items: SearchResultItem[]): SearchResultItem[] {
    const withImage: SearchResultItem[] = []
    const withoutImage: SearchResultItem[] = []

    for (const item of items) {
        if (item.imageUrl && item.imageUrl.trim().length > 0) {
            withImage.push(item)
        } else {
            withoutImage.push(item)
        }
    }

    return [...withImage, ...withoutImage]
}

function PublicCarousel() {
    const locale = getActiveLocale(window.location.pathname)
    const messages = getMessages(locale)
    const [items, setItems] = useState<SearchResultItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<CarouselMode>('on-this-day')
    const scrollerRef = useRef<HTMLDivElement | null>(null)
    const referenceDate = useMemo(() => {
        const now = new Date()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        return `${now.getFullYear()}-${month}-${day}`
    }, [])

    useEffect(() => {
        const abortController = new AbortController()

        const loadCarouselItems = async () => {
            setIsLoading(true)
            setError(null)

            const loadFallbackItems = async () => {
                const fallbackParams = new URLSearchParams({
                    page: '1',
                    limit: '100',
                    lang: locale,
                    sort: 'recent',
                })

                const fallbackResponse = await apiFetch<PaginatedApiResponse<ProductionApiItem>>(
                    `/archive/productions?${fallbackParams.toString()}`,
                    { signal: abortController.signal },
                )

                const fallbackItems = fallbackResponse.data
                    .map((item) => mapProductionToCarouselItem(item, locale, 'fallback-recent'))
                    .filter((item): item is SearchResultItem => item !== null)

                return prioritizeItemsWithImage(fallbackItems)
            }

            try {
                const onThisDayParams = new URLSearchParams({
                    page: '1',
                    limit: '100',
                    lang: locale,
                    onThisDay: 'true',
                    referenceDate,
                    sort: 'oldest',
                })

                const onThisDayResponse = await apiFetch<PaginatedApiResponse<ProductionApiItem>>(
                    `/archive/productions?${onThisDayParams.toString()}`,
                    { signal: abortController.signal },
                )

                const onThisDayItems = onThisDayResponse.data
                    .map((item) => mapProductionToCarouselItem(item, locale, 'on-this-day'))
                    .filter((item): item is SearchResultItem => item !== null)

                const prioritizedOnThisDayItems = prioritizeItemsWithImage(onThisDayItems)

                if (prioritizedOnThisDayItems.length > 0) {
                    setMode('on-this-day')
                    setItems(prioritizedOnThisDayItems)
                    return
                }

                const prioritizedFallbackItems = await loadFallbackItems()

                setMode('fallback-recent')
                setItems(prioritizedFallbackItems)
            } catch {
                if (abortController.signal.aborted) {
                    return
                }

                try {
                    const prioritizedFallbackItems = await loadFallbackItems()
                    setMode('fallback-recent')
                    setItems(prioritizedFallbackItems)
                } catch (fallbackError) {
                    const message = fallbackError instanceof Error ? fallbackError.message : 'Request failed'
                    setError(message)
                    setMode('on-this-day')
                    setItems([])
                }
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
    }, [locale, referenceDate])

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

    const heading = mode === 'fallback-recent'
        ? messages.home.onThisDayFallbackHeading
        : messages.home.onThisDayHeading

    return (
        <section className="bg-foreground/3 py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex flex-col items-center sm:block">
                    <SectionTitle title={heading} subtitle={messages.home.onThisDaySubheading} align="center" />
                    <Link
                        to={withLocalePath('/zoeken', locale)}
                        className="mt-2 text-lg font-semibold text-foreground transition-opacity hover:opacity-70 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 sm:mt-0"
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
                            className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto py-6 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`w-[280px] shrink-0 snap-start border border-border bg-surface p-4 transition-transform duration-300 hover:rotate-0 hover:shadow-lg sm:w-[310px] ${
                                        index % 2 === 0 ? '-rotate-3' : 'rotate-3'
                                    }`}
                                >
                                    <SearchResultCard item={item} detailHref={withLocalePath(`/archive/${item.id}`, locale)} />
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
