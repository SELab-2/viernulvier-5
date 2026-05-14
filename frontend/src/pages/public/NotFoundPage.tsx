import { useNavigate } from 'react-router-dom'
import { getActiveLocale, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicPillButton from '../../components/public/PublicPillButton'
import { usePublicMessages } from '../../components/public/PublicMessagesContext'

export function NotFoundContent() {
    const navigate = useNavigate()
    const messages = usePublicMessages()
    const locale = getActiveLocale(window.location.pathname)

    const handleGoHome = () => {
        navigate(withLocalePath('/', locale))
    }

    const handleGoSearch = () => {
        navigate(withLocalePath('/zoeken', locale))
    }

    return (
        <section className="relative overflow-hidden py-16 md:py-24">
            <div className="pointer-events-none absolute -left-32 top-44 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 -top-8 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />

            <div className="site-container relative flex max-w-3xl flex-col items-center text-center">
                <h1 className="text-6xl font-regular leading-none text-text md:text-8xl">
                    <span>{messages.notFound.titleTop}</span>{' '}
                    <span className="text-accent">{messages.notFound.titleAccent}</span>{' '}
                    <span className="text-text">{messages.notFound.titleBottom}</span>
                </h1>

                <p className="mt-6 text-lg font-semibold text-accent md:text-xl">
                    {messages.notFound.joke}
                </p>

                <p className="mt-4 max-w-xl whitespace-pre-line text-base text-muted md:text-lg">
                    {messages.notFound.description}
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <PublicPillButton
                        label={messages.notFound.homeButton}
                        variant="solid"
                        onClick={handleGoHome}
                    />
                    <PublicPillButton
                        label={messages.notFound.searchButton}
                        variant="outline"
                        onClick={handleGoSearch}
                    />
                </div>
            </div>
        </section>
    )
}

function NotFoundPage() {
    return (
        <PublicLayout>
            <NotFoundContent />
        </PublicLayout>
    )
}

export default NotFoundPage
