import { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { getActiveLocale, getMessages, setActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'
import type { Theme } from '../shared/TopBarControls'
import AdminFooter from './AdminFooter'
import { AdminMessagesContext } from './AdminMessagesContext'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'

type AdminLayoutProps = {
    children: React.ReactNode
    mainClassName?: string
    userName?: string
    userRole?: string
    showSidebar?: boolean
}

function resolveTheme(): Theme {
    const explicitTheme = document.documentElement.dataset.theme
    if (explicitTheme === 'light' || explicitTheme === 'dark') {
        return explicitTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function AdminLayout({
    children,
    mainClassName = '',
    userName = 'Artevelde stagiair',
    userRole = 'Administrator',
    showSidebar = false,
}: AdminLayoutProps) {
    const [locale, setLocale] = useState<Locale>(() => getActiveLocale(window.location.pathname))
    const [theme, setTheme] = useState<Theme>(resolveTheme)
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
    const drawerRef = useRef<HTMLDivElement>(null)
    const openerRef = useRef<HTMLButtonElement>(null)
    const messages = useMemo(() => getMessages(locale), [locale])

    const FOCUSABLE_SELECTOR =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const getFocusableElements = useCallback((): HTMLElement[] => {
        if (!drawerRef.current) return []
        return Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    }, [])

    const toggleLocale = () => {
        const nextLocale: Locale = locale === 'nl' ? 'en' : 'nl'
        setActiveLocale(nextLocale)
        setLocale(nextLocale)
    }

    const selectTheme = (next: Theme) => {
        document.documentElement.dataset.theme = next
        localStorage.setItem('theme', next)
        setTheme(next)
    }

    const openMobileSidebar = () => setMobileSidebarOpen(true)

    const closeMobileSidebar = useCallback(() => {
        setMobileSidebarOpen(false)
        openerRef.current?.focus()
    }, [])

    useEffect(() => {
        if (!mobileSidebarOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeMobileSidebar()
                return
            }

            if (e.key === 'Tab') {
                const focusable = getFocusableElements()
                if (focusable.length === 0) return

                const first = focusable[0]
                const last = focusable[focusable.length - 1]

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault()
                        last.focus()
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault()
                        first.focus()
                    }
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [mobileSidebarOpen, closeMobileSidebar, getFocusableElements])

    useEffect(() => {
        if (mobileSidebarOpen && drawerRef.current) {
            const focusable = drawerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
            focusable?.focus()
        }
    }, [mobileSidebarOpen])

    return (
        <AdminMessagesContext.Provider value={messages}>
            <div className="admin-shell min-h-screen bg-[var(--color-admin-bg)] text-foreground">
                <AdminTopBar
                    locale={locale}
                    theme={theme}
                    onToggleLocale={toggleLocale}
                    onSelectTheme={selectTheme}
                    themeToggleDark={messages.admin.themeToggleDark}
                    themeToggleLight={messages.admin.themeToggleLight}
                    localeToggleAriaLabel={messages.admin.localeToggleAriaLabel}
                    showSidebar={showSidebar}
                    onOpenSidebar={showSidebar ? openMobileSidebar : undefined}
                    openSidebarLabel={messages.admin.openSidebarLabel}
                    openerRef={openerRef}
                />

                <div className="flex w-full items-stretch lg:min-h-[calc(100vh-4.5rem)]">
                    {showSidebar ? (
                        <div className="hidden lg:flex lg:shrink-0">
                            <AdminSidebar userName={userName} userRole={userRole} />
                        </div>
                    ) : null}

                    {showSidebar && mobileSidebarOpen ? (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                                aria-hidden="true"
                                onClick={closeMobileSidebar}
                            />
                            <div
                                ref={drawerRef}
                                role="dialog"
                                aria-modal="true"
                                aria-label={messages.admin.navigationDrawerLabel}
                                className="fixed inset-y-0 left-0 z-50 flex lg:hidden"
                            >
                                <AdminSidebar
                                    userName={userName}
                                    userRole={userRole}
                                    onClose={closeMobileSidebar}
                                />
                            </div>
                        </>
                    ) : null}

                    <main className={['min-w-0 flex-1', mainClassName].filter(Boolean).join(' ')}>{children}</main>
                </div>

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
