import type { RefObject } from 'react'
import type { Locale } from '../../i18n/types'
import { NextLocaleToggle, SegmentedThemeToggle } from '../shared/TopBarControls'
import type { Theme } from '../shared/TopBarControls'

const adminWordmarkSrc = '/admin/admin-wordmark.png'

type AdminTopBarProps = {
    locale: Locale
    theme: Theme
    onToggleLocale: () => void
    onSelectTheme: (theme: Theme) => void
    themeToggleDark: string
    themeToggleLight: string
    localeToggleAriaLabel: string
    onOpenSidebar?: () => void
    openSidebarLabel?: string
    openerRef?: RefObject<HTMLButtonElement | null>
    showSidebar?: boolean
}

function AdminTopBar({
    locale,
    theme,
    onToggleLocale,
    onSelectTheme,
    themeToggleDark,
    themeToggleLight,
    localeToggleAriaLabel,
    onOpenSidebar,
    openSidebarLabel,
    openerRef,
    showSidebar = false,
}: AdminTopBarProps) {
    return (
        <header className="bg-black text-white">
            <div className="site-container flex min-h-16 items-center justify-between gap-4 py-4 max-[640px]:min-h-14 max-[640px]:py-3">
                <div className="flex items-center gap-1 max-[640px]:gap-1">
                    {showSidebar && onOpenSidebar ? (
                        <button
                            ref={openerRef}
                            type="button"
                            onClick={onOpenSidebar}
                            aria-label={openSidebarLabel}
                            className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 lg:hidden"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    ) : null}
                    <img src={adminWordmarkSrc} alt="VIERNULVIER" className="h-[1.55rem] w-auto shrink-0 object-contain max-[640px]:h-[1.35rem]" />
                </div>

                <div className="flex items-center gap-4">
                    <SegmentedThemeToggle
                        theme={theme}
                        darkLabel={themeToggleDark}
                        lightLabel={themeToggleLight}
                        onSelectTheme={onSelectTheme}
                    />

                    <NextLocaleToggle
                        locale={locale}
                        ariaLabel={localeToggleAriaLabel}
                        onToggleLocale={onToggleLocale}
                        className="text-md text-white max-[480px]:text-sm"
                    />
                </div>
            </div>
        </header>
    )
}

export default AdminTopBar
