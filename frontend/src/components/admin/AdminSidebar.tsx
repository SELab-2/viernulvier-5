import { NavLink } from 'react-router-dom'
import { getAdminNavigationItems } from './adminNavigation'

type AdminSidebarProps = {
    userName: string
    userRole: string
}

function AdminSidebar({ userName, userRole }: AdminSidebarProps) {
    const navigation = getAdminNavigationItems()

    return (
        <aside className="hidden w-[252px] shrink-0 border-r border-[var(--color-admin-card-border)] bg-white lg:flex lg:min-h-[calc(100vh-4.5rem)] lg:flex-col lg:justify-between dark:bg-[#111318]">
            <div className="px-6 py-6">
                <nav className="space-y-1">
                    {navigation.primary.map((item) => {
                        if (!item.to) {
                            return (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 opacity-70"
                                >
                                    <img src={item.iconSrc} alt={item.iconAlt} className="h-4 w-4 shrink-0 opacity-70" />
                                    <span>{item.label}</span>
                                </div>
                            )
                        }

                        return (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                className={({ isActive }) =>
                                    [
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                        isActive
                                            ? 'bg-[rgba(130,36,227,0.1)] font-medium text-accent'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80',
                                    ].join(' ')
                                }
                            >
                                <img src={item.iconSrc} alt={item.iconAlt} className="h-4 w-4 shrink-0" />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t border-[var(--color-admin-card-border)] px-6 py-6">
                <div className="space-y-4">
                    {navigation.secondary.map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 opacity-80 dark:text-slate-300"
                        >
                            <img src={item.iconSrc} alt={item.iconAlt} className="h-4 w-4 shrink-0 opacity-80" />
                            <span>{item.label}</span>
                        </div>
                    ))}

                    <div className="flex items-center gap-3 px-3 pt-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                            {userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-900 dark:text-white">{userName}</p>
                            <p className="truncate text-[10px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{userRole}</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default AdminSidebar
