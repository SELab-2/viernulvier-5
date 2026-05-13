import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { withLocalePath } from '../../i18n'
import { NextLocaleToggle, SegmentedThemeToggle } from '../shared/TopBarControls'
import { usePublicMessages } from './PublicMessagesContext'

type Theme = 'light' | 'dark'

function resolveTheme(): Theme {
    const explicitTheme = document.documentElement.dataset.theme
    if (explicitTheme === 'light' || explicitTheme === 'dark') {
        return explicitTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function SearchIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16L21 21" />
        </svg>
    )
}

function HamburgerIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
    )
}

function CloseIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
    )
}

type PublicNavbarProps = {
    locale: 'nl' | 'en'
    onToggleLocale: () => void
}

function PublicNavbar({ locale, onToggleLocale }: PublicNavbarProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const messages = usePublicMessages()
    const [theme, setTheme] = useState<Theme>(resolveTheme)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

        const updateFromSystem = (event: MediaQueryListEvent) => {
            if (!document.documentElement.dataset.theme) {
                setTheme(event.matches ? 'dark' : 'light')
            }
        }

        mediaQuery.addEventListener('change', updateFromSystem)
        return () => mediaQuery.removeEventListener('change', updateFromSystem)
    }, [])

    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width: 480px)')
        const updateMobileState = () => {
            if (!mobileQuery.matches) {
                setIsMobileMenuOpen(false)
            }
        }

        mobileQuery.addEventListener('change', updateMobileState)
        return () => mobileQuery.removeEventListener('change', updateMobileState)
    }, [])

    const applyTheme = (nextTheme: Theme) => {
        setTheme(nextTheme)
        document.documentElement.dataset.theme = nextTheme
        localStorage.setItem('theme', nextTheme)
    }

    const toggleLocale = () => {
        onToggleLocale()
        const nextLocale = locale === 'nl' ? 'en' : 'nl'
        const localizedPath = withLocalePath(location.pathname, nextLocale)
        navigate(`${localizedPath}${location.search}${location.hash}`)
    }

    return (
        <header className="sticky top-0 z-50 bg-black">
            <div className="site-container flex h-16 items-center justify-between max-md:h-14">
                <div className="flex items-end gap-1">
                    <Link to={withLocalePath('/', locale)} className="inline-flex items-center" aria-label={messages.home.title}>
                        <img src="/logo-white.png" alt={messages.common.brandLogoAlt} className="h-8 w-auto max-md:h-7" />
                    </Link>
                    <h3 className="text-lg leading-none font-light text-grey max-md:text-base">| {messages.nav.archive}</h3>
                </div>

                <button
                    type="button"
                    className="hidden h-9 w-9 items-center justify-center text-white max-md:inline-flex"
                    aria-label={isMobileMenuOpen ? messages.nav.closeMenuLabel : messages.nav.openMenuLabel}
                    aria-expanded={isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                >
                    {isMobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <HamburgerIcon className="h-5 w-5" />}
                </button>

                <nav aria-label={messages.nav.navAriaLabel} className="max-md:hidden">
                    <ul className="flex items-center gap-6 text-sm font-medium text-white">
                        <li>
                            <Link
                                to={withLocalePath('/zoeken', locale)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black"
                            >
                                <SearchIcon className="h-3 w-3" />
                                {messages.nav.searchLink}
                            </Link>
                        </li>
                        <li>
                            <Link
                                to={withLocalePath('/blogs', locale)}
                                className="inline-flex items-center rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black"
                            >
                                {messages.nav.blogsLink}
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center gap-4">
                                <SegmentedThemeToggle
                                    theme={theme}
                                    darkLabel={messages.auth.darkModeLabel}
                                    lightLabel={messages.auth.lightModeLabel}
                                    onSelectTheme={applyTheme}
                                />

                                <NextLocaleToggle
                                    locale={locale}
                                    ariaLabel={messages.auth.localeToggleLabel}
                                    onToggleLocale={toggleLocale}
                                    className="text-md text-white max-md:text-sm"
                                />
                            </div>
                        </li>
                    </ul>
                </nav>
            </div>

            <div
                className={`hidden overflow-hidden border-t border-white/10 max-md:block ${isMobileMenuOpen ? 'max-h-64 py-3' : 'max-h-0 py-0'}`}
            >
                <div className="site-container text-xs text-white">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                        <Link
                            to={withLocalePath('/zoeken', locale)}
                            className="inline-flex items-center gap-1 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <SearchIcon className="h-3 w-3" />
                            {messages.nav.searchLink}
                        </Link>
                        <Link
                            to={withLocalePath('/blogs', locale)}
                            className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white hover:bg-white hover:text-black"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {messages.nav.blogsLink}
                        </Link>
                        </div>
                        <div className="flex items-center gap-3">
                        <SegmentedThemeToggle
                            theme={theme}
                            darkLabel={messages.auth.darkModeLabel}
                            lightLabel={messages.auth.lightModeLabel}
                            onSelectTheme={applyTheme}
                        />

                        <NextLocaleToggle
                            locale={locale}
                            ariaLabel={messages.auth.localeToggleLabel}
                            onToggleLocale={toggleLocale}
                            className="text-sm text-white"
                        />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default PublicNavbar
