import { useNavigate, useParams } from 'react-router-dom'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicPillButton from '../../components/public/PublicPillButton'

/**
 * Public archive detail page — shows a single archive item.
 */
function ArchiveDetailPage() {
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const messages = getMessages()

    const { id } = useParams<{ id: string }>()

    /*
    const handlePopularTagClick = (tag: string) => {
        const params = new URLSearchParams()
        params.set('genre', tag)
        navigate(`${withLocalePath('/zoeken', locale)}?${params.toString()}`)
    }
    */

    const handleGoBackToHome = () => {
        navigate(-1) || navigate(withLocalePath('/', locale))
    }
    
    // QUESTION: Do we want to navigate back home, or just go back to previous page, this would preserve any search filters the user had applied.
    // It would however also just go back if fe you changed the language, to the same page you're on (just back to the old language) 

    // QUESTION: For the arrow, now i just used a unicode character, but would it be better to do something else. Fe instead of using PublicPillButton
    // which doesn't have a children prop, maybe make a seperate PublicIconButton component. Or update PublicPillButton to also accept children?

    // QUESTION: Would it be worth it to make a PublicBackButton component, which would just be a wrapper around PublicPillButton but with the arrow and the "back to overview" text already in place?
    // This would make it easier to reuse this button in other places, and also make it more consistent across the site. But on the other hand, it might be overkill for just one button.
    
    return (
        <PublicLayout>
            <div className="site-container mt-8">
                <PublicPillButton label={`${messages.detail.navBackToOverview}`} onClick={handleGoBackToHome} />
            </div>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Archief Detail
                </h1>
                <p className="text-gray-600">Item ID: {id}</p>
                {/* TODO: Fetch and display archive item */}
            </div>
        </PublicLayout>
    )
}

export default ArchiveDetailPage
