import { NavLink } from 'react-router-dom'
import type { Messages } from '../../i18n/types'
import { useAdminMessages } from './AdminMessagesContext'
import { getAdminNavigationItems } from './adminNavigation'
import type { AdminNavItemId } from './adminNavigation'

type AdminSidebarProps = {
  userName: string
  userRole: string
  onOpenSettings: () => void
  onClose?: () => void
}

type AdminNavMessages = Messages['admin']['nav']

function getNavLabel(id: AdminNavItemId, nav: AdminNavMessages): string {
  const labelMap: Record<AdminNavItemId, string> = {
    dashboard: nav.dashboard,
    productions: nav.productions,
    gallery: nav.gallery,
    organisation: nav.organisation,
    settings: nav.settings,
  }

  return labelMap[id]
}

function getNavIconAlt(id: AdminNavItemId, nav: AdminNavMessages): string {
  const altMap: Record<AdminNavItemId, string> = {
    dashboard: nav.dashboardIconAlt,
    productions: nav.productionsIconAlt,
    gallery: nav.galleryIconAlt,
    organisation: nav.organisationIconAlt,
    settings: nav.settingsIconAlt,
  }

  return altMap[id]
}

function SettingsIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

function AdminSidebar({ userName, userRole, onOpenSettings, onClose }: AdminSidebarProps) {
  const navigation = getAdminNavigationItems()
  const messages = useAdminMessages()
  const nav = messages.admin.nav

  function handleOpenSettings() {
    onOpenSettings()
    onClose?.()
  }

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
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 opacity-70 dark:text-slate-400"
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

      <div className="border-t border-[var(--color-admin-card-border)] px-6 py-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleOpenSettings}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80"
          >
            <SettingsIcon className="h-4 w-4 shrink-0" />
            <span>{messages.settings.title}</span>
          </button>

          <div className="flex items-center gap-3 px-3 pt-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
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
