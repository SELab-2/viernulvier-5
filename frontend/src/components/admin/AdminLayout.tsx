import { useMemo, useState } from 'react'
import { getActiveLocale, getMessages, setActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'
import type { Theme } from '../shared/TopBarControls'
import AdminFooter from './AdminFooter'
import { AdminMessagesContext } from './AdminMessagesContext'
import AdminTopBar from './AdminTopBar'

type AdminLayoutProps = {
    children: React.ReactNode
    mainClassName?: string
}

function resolveTheme(): Theme {
    const explicitTheme = document.documentElement.dataset.theme
    if (explicitTheme === 'light' || explicitTheme === 'dark') {
        return explicitTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function AdminLayout({ children, mainClassName = '' }: AdminLayoutProps) {
    const [locale, setLocale] = useState<Locale>(() => getActiveLocale(window.location.pathname))
    const [theme, setTheme] = useState<Theme>(resolveTheme)
    const messages = useMemo(() => getMessages(locale), [locale])

    const toggleLocale = () => {
        const nextLocale: Locale = locale === 'nl' ? 'en' : 'nl'
        setActiveLocale(nextLocale)
        setLocale(nextLocale)
    }

    const toggleTheme = () => {
        const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
        document.documentElement.dataset.theme = nextTheme
        localStorage.setItem('theme', nextTheme)
        setTheme(nextTheme)
    }

    return (
        <AdminMessagesContext.Provider value={messages}>
            <div className="admin-shell min-h-screen bg-[var(--color-admin-bg)] text-foreground">
                <AdminTopBar
                    locale={locale}
                    localeLabel={messages.auth.localeToggleLabel}
                    theme={theme}
                    onToggleLocale={toggleLocale}
                    onToggleTheme={toggleTheme}
                />

                <main className={mainClassName}>{children}</main>

                <AdminFooter
                    navigationTitle={messages.auth.navigationTitle}
                    dashboardLabel={messages.auth.dashboardLabel}
                    productionsLabel={messages.auth.productionsLabel}
                    statisticsLabel={messages.auth.statisticsLabel}
                    archiveLabel={messages.auth.archiveLabel}
                    logoutLabel={messages.auth.logoutLabel}
                    privacyLabel={messages.footer.privacy}
                    cookiesLabel={messages.footer.cookies}
                    disclaimerLabel={messages.footer.disclaimer}
                    rightsLabel={messages.footer.rights}
                />
            </div>
        </AdminMessagesContext.Provider>
    )
}

export default AdminLayout
