import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getActiveLocale, getMessages, setActiveLocale, withLocalePath } from '../../i18n'

type Theme = 'light' | 'dark'

function resolveTheme(): Theme {
    const explicitTheme = document.documentElement.dataset.theme
    if (explicitTheme === 'light' || explicitTheme === 'dark') {
        return explicitTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function SunIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
        </svg>
    )
}

function MoonIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <path d="M20.6 14.6a8.5 8.5 0 1 1-11.2-11.2 7 7 0 1 0 11.2 11.2Z" />
        </svg>
    )
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

type ThemeToggleProps = {
    theme: Theme
    applyTheme: (nextTheme: Theme) => void
}

function ThemeToggle({ theme, applyTheme }: ThemeToggleProps) {
    return (
        <div className="inline-flex h-8 w-16 items-center border border-border bg-grey">
            <button
                type="button"
                onClick={() => applyTheme('dark')}
                className={`inline-flex h-8 w-8 items-center justify-center cursor-pointer text-black transition-colors ${theme === 'dark' ? 'bg-white' : 'bg-grey'}`}
                aria-label="Donkere modus"
                aria-pressed={theme === 'dark'}
            >
                <MoonIcon className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => applyTheme('light')}
                className={`inline-flex h-8 w-8 items-center justify-center cursor-pointer text-black transition-colors ${theme === 'light' ? 'bg-white' : 'bg-grey'}`}
                aria-label="Lichte modus"
                aria-pressed={theme === 'light'}
            >
                <SunIcon className="h-4 w-4" />
            </button>
        </div>
    )
}

type LocaleToggleButtonProps = {
    locale: 'nl' | 'en'
    onToggle: () => void
    className: string
}

function LocaleToggleButton({ locale, onToggle, className }: LocaleToggleButtonProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={className}
            aria-label="Wissel taal"
        >
            {locale === 'nl' ? 'EN' : 'NL'}
        </button>
    )
}

type SearchToggleButtonProps = {
    onToggle: () => void
    ariaLabel: string
    isExpanded: boolean
    className: string
}

function SearchToggleButton({ onToggle, ariaLabel, isExpanded, className }: SearchToggleButtonProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={className}
            aria-label={ariaLabel}
            aria-expanded={isExpanded}
        >
            <SearchIcon className="h-4 w-4" />
        </button>
    )
}

function PublicNavbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const locale = getActiveLocale(location.pathname)
    const messages = getMessages(locale)
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
                    <Link to={withLocalePath('/', locale)} className="inline-flex items-center" aria-label={messages.home.title}>
                        <img src="/logo-white.png" alt="VIERNULVIER Logo" className="h-8 w-auto max-[480px]:h-7" />
                    </Link>
                    <h3 className="text-lg leading-none font-light text-grey max-[480px]:text-base">| {messages.nav.archive}</h3>
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
                                <ThemeToggle theme={theme} applyTheme={applyTheme} />

                                <LocaleToggleButton
                                    locale={locale}
                                    onToggle={toggleLocale}
                                    className="inline-flex h-8 items-center justify-center cursor-pointer text-md font-semibold text-white max-[480px]:text-sm"
                                />

                                <SearchToggleButton
                                    onToggle={() => setIsSearchOpen((open) => !open)}
                                    ariaLabel={messages.nav.searchAriaLabel}
                                    isExpanded={isSearchOpen}
                                    className="inline-flex h-8 items-center justify-center text-white"
                                />

                                <div
                                    className={`overflow-hidden transition-all duration-300 ${isSearchOpen ? 'ml-2 w-72 opacity-100' : 'ml-0 w-0 opacity-0'}`}
                                >
                                    <input
                                        type="text"
                                        placeholder={messages.nav.searchPlaceholder}
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
                        <ThemeToggle theme={theme} applyTheme={applyTheme} />

                        <LocaleToggleButton
                            locale={locale}
                            onToggle={toggleLocale}
                            className="inline-flex h-8 items-center justify-center cursor-pointer text-sm font-semibold text-white"
                        />

                        <SearchToggleButton
                            onToggle={() => setIsSearchOpen((open) => !open)}
                            ariaLabel={messages.nav.searchAriaLabel}
                            isExpanded={isSearchOpen}
                            className="inline-flex h-8 w-8 items-center justify-center text-white"
                        />
                    </div>

                    {isSearchOpen ? (
                        <input
                            type="text"
                            placeholder={messages.nav.searchPlaceholder}
                            className="h-9 w-full rounded-sm border bg-surface px-3 text-xs text-foreground placeholder:text-muted"
                        />
                    ) : null}
                </div>
            </div>
        </header>
    )
}

export default PublicNavbar
