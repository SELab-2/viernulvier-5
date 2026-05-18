import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicHeroSearch, { type HeroSearchFilters } from '../../components/public/PublicHeroSearch'
import PublicPopularTags from '../../components/public/PublicPopularTags'
import PublicCarousel from '../../components/public/PublicCarousel'
import PublicLatestBlogPreview from '../../components/public/PublicLatestBlogPreview'
import PublicRecentDigitized from '../../components/public/PublicRecentDigitized'
import { getRecentProductions, type Production } from '../../api/productions'
import { getLatestBlog, type Blog } from '../../api/blogs'

/**
 * Public home page — displays the archive listing.
 */
function HomePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const locale = getActiveLocale(window.location.pathname)
    const homeMessages = getMessages(locale).home
    const fallbackUntitled = homeMessages.fallbackUntitled
    const [latestBlog, setLatestBlog] = useState<Blog | null>(null)
    const [recentItems, setRecentItems] = useState<Production[]>([])

    const initialFilters = useMemo<HeroSearchFilters>(
        () => ({
            query: searchParams.get('q') ?? '',
            yearFrom: searchParams.get('yearFrom') ? Number(searchParams.get('yearFrom')) : undefined,
            yearTo: searchParams.get('yearTo') ? Number(searchParams.get('yearTo')) : undefined,
            genre: searchParams.get('genre') ?? undefined,
        }),
        [searchParams]
    )

    const handleSearch = (filters: HeroSearchFilters) => {
        const params = new URLSearchParams()

        if (filters.query) {
            params.set('q', filters.query)
        }

        if (filters.yearFrom) {
            params.set('yearFrom', String(filters.yearFrom))
        }

        if (filters.yearTo) {
            params.set('yearTo', String(filters.yearTo))
        }

        if (filters.genre) {
            params.set('genre', filters.genre)
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

                setLatestBlog(item ?? null)
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
    }, [locale, fallbackUntitled])

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

                if (!canceled) {
                    setRecentItems(response.data)
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
    }, [locale, fallbackUntitled])

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
                locale={locale}
                fallbackUntitled={fallbackUntitled}
                onReadMore={(id) => navigate(withLocalePath(`/blogs/${id}`, locale))}
                onViewAll={() => navigate(withLocalePath('/blogs', locale))}
            />
            <PublicRecentDigitized
                items={recentItems}
                locale={locale}
                fallbackUntitled={fallbackUntitled}
                onViewItem={handleRecentDigitizedItemClick}
                onViewAll={handleRecentDigitizedViewAll}
            />
        </PublicLayout>
    )
}

export default HomePage
