import { Link, useNavigate, useLocation } from 'react-router-dom'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import PublicPillButton from './PublicPillButton'

function PublicBackButton() {
    const location = useLocation()
    const locale = getActiveLocale(location.pathname)
    const messages = getMessages()
    const navigate = useNavigate()

    // QUESTION: Do we want to navigate back home, or just go back to previous page, this would preserve any search filters the user had applied.
    // It would however also just go back if fe you changed the language, to the same page you're on (just back to the old language) 

    // QUESTION: For the arrow, now i just used a unicode character, but would it be better to do something else. Fe instead of using PublicPillButton
    // which doesn't have a children prop, maybe make a seperate PublicIconButton component. Or update PublicPillButton to also accept children?
    return (
        <div className="site-container mt-8">
            <PublicPillButton label={`🡠 ${messages.detail.navBackToOverview}`} onClick={() => navigate(-1) || navigate(withLocalePath('/', locale))} /> 
        </div>
    )
}

export default PublicBackButton