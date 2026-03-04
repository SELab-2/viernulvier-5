import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveLocale, setActiveLocale } from '../../i18n'

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

function PublicNavbar({
    title,
    archiveLabel,
    searchAriaLabel,
    searchPlaceholder,
}: PublicNavbarProps) {
    const [theme, setTheme] = useState<Theme>(resolveTheme)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [locale, setLocale] = useState(getActiveLocale)

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

    const applyTheme = (nextTheme: Theme) => {
        setTheme(nextTheme)
        document.documentElement.dataset.theme = nextTheme
        localStorage.setItem('theme', nextTheme)
    }

    const toggleLocale = () => {
        const nextLocale = locale === 'nl' ? 'en' : 'nl'
        setLocale(nextLocale)
        setActiveLocale(nextLocale)
        window.location.reload()
    }

    return (
        <header className="border-b border-border bg-black">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
                <div className="flex items-end gap-1">
                    <Link to="/" className="inline-flex items-center" aria-label={title}>
                        <img src="/logo-white.png" alt="VIERNULVIER Logo" className="h-8 w-auto" />
                    </Link>
                    <h3 className="text-lg leading-none font-light text-grey">| {archiveLabel}</h3>
                </div>
                
                <nav aria-label="Hoofdnavigatie">
                    <ul className="flex items-center gap-6 text-sm font-medium text-white">
                        <li>
                            <div className="flex items-center gap-4">
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

                                <button
                                    type="button"
                                    onClick={toggleLocale}
                                    className="inline-flex h-8 items-center justify-center cursor-pointer text-md font-semibold text-white"
                                    aria-label="Wissel taal"
                                >
                                    {locale === 'nl' ? 'EN' : 'NL'}
                                </button>

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
        </header>
    )
}

export default PublicNavbar
