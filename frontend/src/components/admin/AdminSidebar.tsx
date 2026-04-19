import { NavLink } from 'react-router-dom'
import { useAdminMessages } from './AdminMessagesContext'
import { getAdminNavigationItems, getNavIconAlt, getNavLabel } from './adminNavigation'

type AdminSidebarProps = {
    userName: string
    userRole: string
    onClose?: () => void
}

function AdminSidebar({ userName, userRole, onClose }: AdminSidebarProps) {
    const messages = useAdminMessages()
    const nav = messages.admin.nav
    const navigation = getAdminNavigationItems()

    return (
        <aside className="flex w-[252px] shrink-0 flex-col justify-between border-r border-[var(--color-admin-card-border)] bg-white dark:bg-[#111318]">
            <div className="px-6 py-6">
                <nav className="space-y-1">
                    {navigation.primary.map((item) => {
                        const label = getNavLabel(item.id, nav)
                        const iconAlt = getNavIconAlt(item.id, nav)

                        if (!item.to) {
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 opacity-70"
                                >
                                    <img src={item.iconSrc} alt={iconAlt} className="h-4 w-4 shrink-0 opacity-70" />
                                    <span>{label}</span>
                                </div>
                            )
                        }

                        return (
                            <NavLink
                                key={item.id}
                                to={item.to}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    [
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                        isActive
                                            ? 'bg-[rgba(130,36,227,0.1)] font-medium text-accent'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80',
                                    ].join(' ')
                                }
                            >
                                <img src={item.iconSrc} alt={iconAlt} className="h-4 w-4 shrink-0" />
                                <span>{label}</span>
                            </NavLink>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t border-[var(--color-admin-card-border)] px-6 py-6">
                <div className="space-y-4">
                    {navigation.secondary.map((item) => {
                        const label = getNavLabel(item.id, nav)
                        const iconAlt = getNavIconAlt(item.id, nav)

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 opacity-80 dark:text-slate-300"
                            >
                                <img src={item.iconSrc} alt={iconAlt} className="h-4 w-4 shrink-0 opacity-80" />
                                <span>{label}</span>
                            </div>
                        )
                    })}

                    <div className="flex items-center gap-3 px-3 pt-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                            {userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-900 dark:text-white">{userName}</p>
                            <p className="truncate text-[10px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{userRole}</p>
                        </div>
                    </div>

                    {onClose ? (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={messages.admin.closeSidebarLabel}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            <span>{messages.admin.closeSidebarLabel}</span>
                        </button>
                    ) : null}
                </div>
            </div>
        </aside>
    )
}

export default AdminSidebar
