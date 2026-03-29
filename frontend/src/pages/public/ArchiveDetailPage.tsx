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
