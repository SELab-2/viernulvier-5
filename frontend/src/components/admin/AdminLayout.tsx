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
    showFooter?: boolean
}

function handleLogout() {
    document.cookie = 'token=; Max-Age=0; path=/'
    window.location.href = getActiveLocale(window.location.pathname) === 'en' ? '/' : '/nl'
}

function getMainClassName(mainClassName: string) {
    return mainClassName ? `${mainClassName} flex-1` : 'flex-1'
}

function resolveTheme(): Theme {
    const explicitTheme = document.documentElement.dataset.theme
    if (explicitTheme === 'light' || explicitTheme === 'dark') {
        return explicitTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function AdminLayout({ children, mainClassName = '', showFooter = true }: AdminLayoutProps) {
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
            <div className="admin-shell min-h-screen flex flex-col bg-[var(--color-admin-bg)] text-foreground">
                <AdminTopBar
                    locale={locale}
                    theme={theme}
                    logoutLabel={messages.auth.logoutLabel}
                    onLogout={handleLogout}
                    onToggleLocale={toggleLocale}
                    onToggleTheme={() => toggleTheme()}
                />

                <main className={getMainClassName(mainClassName)}>{children}</main>

                {showFooter ? <AdminFooter /> : null}
            </div>
        </AdminMessagesContext.Provider>
    )
}

export default AdminLayout
