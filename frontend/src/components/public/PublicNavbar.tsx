import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getActiveLocale, setActiveLocale, withLocalePath } from '../../i18n'
import { NextLocaleToggle, SegmentedThemeToggle } from '../shared/TopBarControls'

type PublicNavbarProps = {
    title: string
    archiveLabel: string
    searchAriaLabel: string
    searchPlaceholder: string
}

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

function PublicNavbar({
    title,
    archiveLabel,
    searchAriaLabel,
    searchPlaceholder,
}: PublicNavbarProps) {
    const location = useLocation()
    const navigate = useNavigate()
    const locale = getActiveLocale(location.pathname)
    const [theme, setTheme] = useState<Theme>(resolveTheme)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
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
                setIsSearchOpen(false)
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
        const nextLocale = locale === 'nl' ? 'en' : 'nl'
        setActiveLocale(nextLocale)
        const localizedPath = withLocalePath(location.pathname, nextLocale)
        navigate(`${localizedPath}${location.search}${location.hash}`)
    }

    return (
        <header className="border-b border-border bg-black">
            <div className="site-container flex h-16 items-center justify-between max-[480px]:h-14">
                <div className="flex items-end gap-1">
                    <Link to={withLocalePath('/', locale)} className="inline-flex items-center" aria-label={title}>
                        <img src="/logo-white.png" alt="VIERNULVIER Logo" className="h-8 w-auto max-[480px]:h-7" />
                    </Link>
                    <h3 className="text-lg leading-none font-light text-grey max-[480px]:text-base">| {archiveLabel}</h3>
                </div>

                <button
                    type="button"
                    className="hidden h-9 w-9 items-center justify-center text-white max-[480px]:inline-flex"
                    aria-label={isMobileMenuOpen ? 'Sluit menu' : 'Open menu'}
                    aria-expanded={isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                >
                    {isMobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <HamburgerIcon className="h-5 w-5" />}
                </button>

                <nav aria-label="Hoofdnavigatie" className="max-[480px]:hidden">
                    <ul className="flex items-center gap-6 text-sm font-medium text-white">
                        <li>
                            <div className="flex items-center gap-4">
                                <SegmentedThemeToggle
                                    theme={theme}
                                    darkLabel="Donkere modus"
                                    lightLabel="Lichte modus"
                                    onSelectTheme={applyTheme}
                                />

                                <NextLocaleToggle
                                    locale={locale}
                                    ariaLabel="Wissel taal"
                                    onToggleLocale={toggleLocale}
                                    className="text-md text-white max-[480px]:text-sm"
                                />

                                <button
                                    type="button"
                                    onClick={() => setIsSearchOpen((open) => !open)}
                                    className=" inline-flex h-8 items-center justify-center text-white"
                                    aria-label={searchAriaLabel}
                                    aria-expanded={isSearchOpen}
                                >
                                    <SearchIcon className="h-4 w-4" />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ${isSearchOpen ? 'ml-2 w-72 opacity-100' : 'ml-0 w-0 opacity-0'}`}
                                >
                                    <input
                                        type="text"
                                        placeholder={searchPlaceholder}
                                        className="h-8 w-72 border rounded-sm bg-surface px-3 text-sm text-foreground placeholder:text-muted"
                                    />
                                </div>
                            </div>
                        </li>
                    </ul>
                </nav>
            </div>

            <div
                className={`hidden overflow-hidden border-t border-white/10 max-[480px]:block ${isMobileMenuOpen ? 'max-h-64 py-3' : 'max-h-0 py-0'}`}
            >
                <div className="site-container space-y-3 text-xs text-white">
                    <div className="flex items-center justify-between">
                        <SegmentedThemeToggle
                            theme={theme}
                            darkLabel="Donkere modus"
                            lightLabel="Lichte modus"
                            onSelectTheme={applyTheme}
                        />

                        <NextLocaleToggle
                            locale={locale}
                            ariaLabel="Wissel taal"
                            onToggleLocale={toggleLocale}
                            className="text-sm text-white"
                        />

                        <button
                            type="button"
                            onClick={() => setIsSearchOpen((open) => !open)}
                            className="inline-flex h-8 w-8 items-center justify-center text-white"
                            aria-label={searchAriaLabel}
                            aria-expanded={isSearchOpen}
                        >
                            <SearchIcon className="h-4 w-4" />
                        </button>
                    </div>

                    {isSearchOpen ? (
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="h-9 w-full rounded-sm border bg-surface px-3 text-xs text-foreground placeholder:text-muted"
                        />
                    ) : null}
                </div>
            </div>
        </header>
    )
}

export default PublicNavbar
