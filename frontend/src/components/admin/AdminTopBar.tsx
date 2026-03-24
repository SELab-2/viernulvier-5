import type { Locale } from '../../i18n/types'

const adminWordmarkSrc = 'https://www.figma.com/api/mcp/asset/6e84969d-e20d-4ef0-a50a-5bcef7871037'

type Theme = 'light' | 'dark'

type AdminTopBarProps = {
    locale: Locale
    adminLabel: string
    localeLabel: string
    theme: Theme
    onToggleLocale: () => void
    onToggleTheme: () => void
}

function getNextLocale(locale: Locale): Locale {
    return locale === 'nl' ? 'en' : 'nl'
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

function AdminTopBar({
    locale,
    adminLabel,
    localeLabel,
    theme,
    onToggleLocale,
    onToggleTheme,
}: AdminTopBarProps) {
    const nextLocale = getNextLocale(locale)

    return (
        <header className="bg-black text-white">
            <div className="site-container flex min-h-16 items-center justify-between gap-4 py-4 max-[640px]:min-h-14 max-[640px]:py-3">
                <div className="flex items-center gap-1 max-[640px]:gap-1">
                    <img src={adminWordmarkSrc} alt="VIERNULVIER" className="h-[1.55rem] w-auto shrink-0 object-contain max-[640px]:h-[1.35rem]" />
                    <span className="text-[0.95rem] font-medium uppercase tracking-[0.08em] text-white/85 max-[640px]:text-xs">
                        {adminLabel}
                    </span>
                </div>

                <div className="flex items-center gap-2 max-[640px]:gap-2">
                    <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                        aria-label={theme === 'light' ? 'Donkere modus inschakelen' : 'Lichte modus inschakelen'}
                        onClick={onToggleTheme}
                    >
                        {theme === 'light' ? <SunIcon className="h-3.5 w-3.5" /> : <MoonIcon className="h-3.5 w-3.5" />}
                    </button>

                    <button
                        type="button"
                        className="inline-flex min-w-11 items-center justify-center rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white/35 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                        aria-label={localeLabel}
                        onClick={onToggleLocale}
                    >
                        {nextLocale}
                    </button>
                </div>
            </div>
        </header>
    )
}

export default AdminTopBar
