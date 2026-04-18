import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getActiveLocale, getMessages, setActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'
import { PublicMessagesContext } from './PublicMessagesContext'
import PublicNavbar from './PublicNavbar'
import PublicFooter from './PublicFooter'

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