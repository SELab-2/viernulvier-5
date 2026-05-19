import { useMemo } from 'react'
import { getActiveLocale, getMessages } from '../i18n'

export function LoadingContent() {
    const locale = getActiveLocale(window.location.pathname)
    const messages = useMemo(() => getMessages(locale), [locale])
    const label = messages.common.loading.replace(/\.+$/u, '')

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={messages.common.loading}
            className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground"
        >
            <div className="pointer-events-none absolute -left-32 top-1/3 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />

            <div className="relative flex flex-col items-center gap-6">
                <div className="flex gap-2.5" aria-hidden="true">
                    <span className="block h-3 w-3 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                    <span className="block h-3 w-3 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                    <span className="block h-3 w-3 animate-bounce rounded-full bg-accent" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{label}</p>
            </div>
        </div>
    )
}

function LoadingPage() {
    return <LoadingContent />
}

export default LoadingPage
