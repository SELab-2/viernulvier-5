import type { Locale } from '../../i18n/types'
import { NextLocaleToggle, SegmentedThemeToggle } from '../shared/TopBarControls'
import type { Theme } from '../shared/TopBarControls'

const adminWordmarkSrc = '/admin-wordmark.png'

type AdminTopBarProps = {
    locale: Locale
    theme: Theme
    logoutLabel: string
    onLogout: () => void
    onToggleLocale: () => void
    onToggleTheme: () => void
}

function AdminTopBar({
    locale,
    theme,
    logoutLabel,
    onLogout,
    onToggleLocale,
    onToggleTheme,
}: AdminTopBarProps) {
    return (
        <header className="bg-black text-white">
            <div className="site-container flex min-h-16 items-center justify-between gap-4 py-4 max-[640px]:min-h-14 max-[640px]:py-3">
                <div className="flex items-center gap-1 max-[640px]:gap-1">
                    <img src={adminWordmarkSrc} alt="VIERNULVIER" className="h-[1.55rem] w-auto shrink-0 object-contain max-[640px]:h-[1.35rem]" />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                    >
                        {logoutLabel}
                    </button>

                    <SegmentedThemeToggle
                        theme={theme}
                        darkLabel="Donkere modus"
                        lightLabel="Lichte modus"
                        onSelectTheme={() => onToggleTheme()}
                    />

                    <NextLocaleToggle
                        locale={locale}
                        ariaLabel="Wissel taal"
                        onToggleLocale={onToggleLocale}
                        className="text-md text-white max-[480px]:text-sm"
                    />
                </div>
            </div>
        </header>
    )
}

export default AdminTopBar
