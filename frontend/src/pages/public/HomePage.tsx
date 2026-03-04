import { useNavigate } from 'react-router-dom'
import { getMessages } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicHeroSearch, { type HeroSearchFilters } from '../../components/public/PublicHeroSearch'

/**
 * Public home page — displays the archive listing.
 */
function HomePage() {
    const messages = getMessages()
    const navigate = useNavigate()

    const handleSearch = (filters: HeroSearchFilters) => {
        const params = new URLSearchParams()

        if (filters.query) {
            params.set('q', filters.query)
        }

        if (filters.year) {
            params.set('year', filters.year)
        }

        const queryString = params.toString()
        navigate(queryString ? `/?${queryString}` : '/')
    }

    return (
        <PublicLayout
            title={messages.home.title}
            archiveLabel={messages.nav.archive}
            searchAriaLabel={messages.nav.searchAriaLabel}
            searchPlaceholder={messages.nav.searchPlaceholder}
        >
            <PublicHeroSearch
                heroTagline={messages.home.heroTagline}
                titleTop={messages.home.heroTitleTop}
                titleAccent={messages.home.heroTitleAccent}
                titleBottom={messages.home.heroTitleBottom}
                intro={messages.home.intro}
                searchPlaceholder={messages.nav.searchPlaceholder}
                searchYearLabel={messages.home.searchYear}
                searchGenreLabel={messages.home.searchGenre}
                searchLocationLabel={messages.home.searchLocation}
                searchButtonLabel={messages.home.searchButton}
                onSearch={handleSearch}
            />
        </PublicLayout>
    )
}

export default HomePage
