import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicHeroSearch, { type HeroSearchFilters } from '../../components/public/PublicHeroSearch'
import PublicPopularTags from '../../components/public/PublicPopularTags'
import PublicCarousel from '../../components/public/PublicCarousel'
import PublicLatestBlogPreview from '../../components/public/PublicLatestBlogPreview'
import PublicRecentDigitized from '../../components/public/PublicRecentDigitized'
import { getRecentProductions } from '../../api/productions'
import { getLatestBlog } from '../../api/blogs'
import { localize } from '../../utils/localize'
import { toPlainText } from '../../utils/text'
import { getLocalizedTitle, getLocalizedContent, normalizeContent } from './blogDetailPage.formatters'

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
    const fallbackUntitled = useMemo(
        () => getMessages(locale).search.fallbackUntitled,
        [locale],
    )
    const [latestBlog, setLatestBlog] = useState<{ id: string; title: string; excerpt: string } | null>(null)
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

    useEffect(() => {
        let canceled = false

        const loadLatestBlog = async () => {
            try {
                const response = await getLatestBlog(locale)
                const item = response.data[0]

                if (canceled) {
                    return
                }

                if (!item) {
                    setLatestBlog(null)
                    return
                }

                const title = getLocalizedTitle(item.title, locale)
                const localizedContent = getLocalizedContent(item.content, locale)
                const delta = normalizeContent(localizedContent)
                const excerptRaw = delta
                    ? delta.ops
                        .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
                        .join('')
                        .replace(/\s+/g, ' ')
                        .trim()
                    : toPlainText(typeof localizedContent === 'string' ? localizedContent : '')

                const excerpt = excerptRaw.length > 320 ? `${excerptRaw.slice(0, 317)}...` : excerptRaw

                setLatestBlog({ id: item.id, title: title || fallbackUntitled, excerpt })
            } catch {
                if (!canceled) {
                    setLatestBlog(null)
                }
            }
        }

        void loadLatestBlog()

        return () => {
            canceled = true
        }
    }, [fallbackUntitled, locale])

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
                    const title = localize(item.title, locale)
                    const descriptionRaw =
                        localize(item.description_short, locale) ||
                        localize(item.teaser, locale) ||
                        localize(item.description, locale) ||
                        title

                    return {
                        id: item.id,
                        dateLabel: formatArchiveDate(item.created_at, locale),
                        archiveLabel: formatArchiveLabel(item.apiId),
                        title: title || fallbackUntitled,
                        description: toPlainText(descriptionRaw) || title || fallbackUntitled,
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
    }, [fallbackUntitled, locale])

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
            <PublicLatestBlogPreview
                blog={latestBlog}
                onReadMore={(id) => navigate(withLocalePath(`/blogs/${id}`, locale))}
                onViewAll={() => navigate(withLocalePath('/zoeken?tab=blogs', locale))}
            />
            <PublicRecentDigitized
                items={recentItems}
                onViewItem={handleRecentDigitizedItemClick}
                onViewAll={handleRecentDigitizedViewAll}
            />
        </PublicLayout>
    )
}

export default HomePage
