import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveLocale, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicHeroSearch, { type HeroSearchFilters } from '../../components/public/PublicHeroSearch'
import PublicPopularTags from '../../components/public/PublicPopularTags'
import PublicCarousel from '../../components/public/PublicCarousel'
import PublicLatestBlogPreview from '../../components/public/PublicLatestBlogPreview'
import PublicRecentDigitized from '../../components/public/PublicRecentDigitized'
import { getRecentProductions } from '../../api/productions'

type LocalizedText = {
    nl?: string
    en?: string
    fr?: string
} | null

function getLocalizedText(text: LocalizedText, locale: 'nl' | 'en'): string {
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

function formatArchiveDate(value: string, locale: 'nl' | 'en'): string {
    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
        return '-'
    }

    return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsedDate).toUpperCase()
}

function formatArchiveLabel(apiId: string | null): string | undefined {
    if (!apiId) {
        return undefined
    }

    const trimmed = apiId.trim()
    if (!trimmed) {
        return undefined
    }

    const lastSegment = trimmed.split('/').filter(Boolean).at(-1)
    if (!lastSegment) {
        return undefined
    }

    return /^\d+$/.test(lastSegment) ? `#${lastSegment}` : lastSegment
}

/**
 * Public home page — displays the archive listing.
 */
function HomePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const locale = getActiveLocale(window.location.pathname)
    const [recentItems, setRecentItems] = useState<Array<{
        id: string
        dateLabel: string
        archiveLabel?: string
        title: string
        description: string
    }>>([])

    const initialFilters = useMemo<HeroSearchFilters>(
        () => ({
            query: searchParams.get('q') ?? '',
            year: searchParams.get('year') ?? undefined,
            genre: searchParams.get('genre') ?? undefined,
            location: searchParams.get('location') ?? undefined,
        }),
        [searchParams]
    )

    const handleSearch = (filters: HeroSearchFilters) => {
        const params = new URLSearchParams()

        if (filters.query) {
            params.set('q', filters.query)
        }

        if (filters.year) {
            params.set('year', filters.year)
        }

        if (filters.genre) {
            params.set('genre', filters.genre)
        }

        if (filters.location) {
            params.set('location', filters.location)
        }

        const queryString = params.toString()
        const searchPath = withLocalePath('/zoeken', locale)
        navigate(queryString ? `${searchPath}?${queryString}` : searchPath)
    }

    const handlePopularTagClick = (tag: string) => {
        const params = new URLSearchParams()
        params.set('genre', tag)
        navigate(`${withLocalePath('/zoeken', locale)}?${params.toString()}`)
    }

    useEffect(() => {
        let canceled = false

        const loadRecentDigitized = async () => {
            try {
                const response = await getRecentProductions(locale, 4)

                const mapped = response.data.map((item) => {
                    const title = getLocalizedText(item.title, locale)
                    const descriptionRaw =
                        getLocalizedText(item.description_short, locale) ||
                        getLocalizedText(item.teaser, locale) ||
                        getLocalizedText(item.description, locale) ||
                        title

                    return {
                        id: item.id,
                        dateLabel: formatArchiveDate(item.created_at, locale),
                        archiveLabel: formatArchiveLabel(item.apiId),
                        title: title || (locale === 'nl' ? 'Zonder titel' : 'Untitled'),
                        description: toPlainText(descriptionRaw) || title || (locale === 'nl' ? 'Zonder titel' : 'Untitled'),
                    }
                })

                if (!canceled) {
                    setRecentItems(mapped)
                }
            } catch {
                if (!canceled) {
                    setRecentItems([])
                }
            }
        }

        void loadRecentDigitized()

        return () => {
            canceled = true
        }
    }, [locale])

    const handleRecentDigitizedItemClick = (id: string) => {
        navigate(withLocalePath(`/archive/${id}`, locale))
    }

    const handleRecentDigitizedViewAll = () => {
        navigate(withLocalePath('/zoeken', locale))
    }

    return (
        <PublicLayout>
            <PublicHeroSearch
                key={searchParams.toString()}
                initialFilters={initialFilters}
                onSearch={handleSearch}
            />
            <PublicPopularTags onTagClick={handlePopularTagClick} />
            <PublicCarousel />
            <PublicLatestBlogPreview />
            <PublicRecentDigitized
                items={recentItems}
                onViewItem={handleRecentDigitizedItemClick}
                onViewAll={handleRecentDigitizedViewAll}
            />
        </PublicLayout>
    )
}

export default HomePage