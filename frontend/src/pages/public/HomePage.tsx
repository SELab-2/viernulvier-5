import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getActiveLocale, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicHeroSearch, { type HeroSearchFilters } from '../../components/public/PublicHeroSearch'
import PublicPopularTags from '../../components/public/PublicPopularTags'
import PublicCarousel from '../../components/public/PublicCarousel'
import PublicLatestBlogPreview from '../../components/public/PublicLatestBlogPreview'
import PublicRecentDigitized from '../../components/public/PublicRecentDigitized'

/**
 * Public home page — displays the archive listing.
 */
function HomePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const locale = getActiveLocale(window.location.pathname)

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

    const handleRecentDigitizedItemClick = (index: number) => {
        navigate(withLocalePath(`/archive/${index + 1}`, locale))
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
                onViewItem={handleRecentDigitizedItemClick}
                onViewAll={handleRecentDigitizedViewAll}
            />
        </PublicLayout>
    )
}

export default HomePage
