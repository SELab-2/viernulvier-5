import { useNavigate, useLoaderData, useParams } from 'react-router-dom'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicPillButton from '../../components/public/PublicPillButton'
import { getProductionById, type Production } from '../../api/productions'

/**
 * Public archive detail page — shows a single archive item.
 */
function ArchiveDetailPage() {
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const messages = getMessages()
    const production = useLoaderData() as Production
    const { id } = useParams<{ id: string }>()

    /*
    const handlePopularTagClick = (tag: string) => {
        const params = new URLSearchParams()
        params.set('genre', tag)
        navigate(`${withLocalePath('/zoeken', locale)}?${params.toString()}`)
    }
    */


    // QUESTION: Do we want to navigate back home, or just go back to previous page, this would preserve any search filters the user had applied.
    // It would however also just go back if fe you changed the language, to the same page you're on (just back to the old language) 
    const handleGoBackToHome = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate(withLocalePath('/', locale))
        }
    }

    const title =
        production.title?.[locale as 'en' | 'nl' | 'fr'] ||
        production.title?.en ||
        production.title?.nl ||
        production.title?.fr

    const description =
        production.description?.[locale as 'en' | 'nl' | 'fr'] ||
        production.description?.en ||
        production.description?.nl ||
        production.description?.fr


    // QUESTION: For the arrow, now i just used a unicode character, but would it be better to do something else. Fe instead of using PublicPillButton
    // which doesn't have a children prop, maybe make a seperate PublicIconButton component. Or update PublicPillButton to also accept children?
    // QUESTION: Would it be worth it to make a PublicBackButton component, which would just be a wrapper around PublicPillButton but with the arrow and the "back to overview" text already in place?
    // This would make it easier to reuse this button in other places, and also make it more consistent across the site. But on the other hand, it might be overkill for just one button.
    return (
        <PublicLayout>
            <div className="site-container mt-8">
                <PublicPillButton 
                    label={`${messages.detail.navBackToOverview}`} 
                    onClick={handleGoBackToHome} 
                />
            </div>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {title || 'Untitled'}
                </h1>

                <p className="text-gray-600 mb-6">
                    Item ID: {production.id}
                </p>

                <div className="prose max-w-none">
                    {description ? (
                        <p>{description}</p>
                    ) : (
                        <p>No description available.</p>
                    )}
                </div>

                {/* Debug / inspection */}
                <div className="mt-8">
                    <pre className="bg-gray-100 p-4 text-xs overflow-auto">
                        {JSON.stringify(production, null, 2)}
                    </pre>
                </div>
            </div>
        </PublicLayout>
    )
}

export default ArchiveDetailPage
