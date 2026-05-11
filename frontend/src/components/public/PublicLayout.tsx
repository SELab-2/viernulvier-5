import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getActiveLocale, getMessages, setActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'
import { PublicMessagesContext } from './PublicMessagesContext'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'
import { useLocation } from 'react-router-dom'
import { trackNavigation } from '../../utils/navigationHistory'


type PublicLayoutProps = {
    children: ReactNode
}

function getInitialLocale(): Locale {
    return getActiveLocale(window.location.pathname)
}

function PublicLayout({ children }: PublicLayoutProps) {
    const [locale, setLocale] = useState<Locale>(getInitialLocale)

    const messages = useMemo(() => getMessages(locale), [locale])

    const handleLocaleChange = (nextLocale: Locale) => {
        setLocale(nextLocale)
        setActiveLocale(nextLocale)
    }

    const location = useLocation()

    useEffect(() => {
        trackNavigation(location.pathname + location.search + location.hash)
    }, [location.pathname, location.search, location.hash])

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])


    return (
        <PublicMessagesContext.Provider value={messages}>
            <div className="flex min-h-screen flex-col bg-background text-foreground">
                <PublicNavbar
                    locale={locale}
                    onToggleLocale={() => handleLocaleChange(locale === 'nl' ? 'en' : 'nl')}
                />
                <main className="mx-auto w-full flex-1">{children}</main>
                <PublicFooter />
            </div>
        </PublicMessagesContext.Provider>
    )
}

export default PublicLayout