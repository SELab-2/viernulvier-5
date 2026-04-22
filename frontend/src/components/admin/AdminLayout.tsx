import { useMemo, useState } from 'react'
import { logoutAdmin } from '../../api/adminAuth'
import { getAdminRouteConfig } from '../../admin/paths'
import { clearPrimedAdminSession } from '../../auth/primedAdminSession'
import { getActiveLocale, getMessages, setActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'
import type { Theme } from '../shared/TopBarControls'
import AdminFooter from './AdminFooter'
import { AdminMessagesContext } from './AdminMessagesContext'
import AdminTopBar from './AdminTopBar'

interface AdminLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
  mainClassName?: string
  showLogout?: boolean
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

function getMainClassName(mainClassName = ''): string {
  return mainClassName ? `${mainClassName} flex-1` : 'flex-1'
}

function resolveTheme(): Theme {
  const explicitTheme = document.documentElement.dataset.theme
  if (explicitTheme === 'light' || explicitTheme === 'dark') {
    return explicitTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialLocale(): Locale {
  return getActiveLocale(window.location.pathname)
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('theme', theme)
}

async function logoutAndRedirect(hostname: string | undefined): Promise<void> {
  try {
    await logoutAdmin()
  } catch {
    // Keep logout UX consistent even if the API call fails.
  } finally {
    clearPrimedAdminSession()
    window.location.assign(getAdminRouteConfig(hostname ?? window.location.hostname).loginPath)
  }
}

function AdminLayout({
  children,
  showFooter = true,
  mainClassName,
  showLogout = true,
  sidebar,
  header
}: AdminLayoutProps) {
  const [theme, setTheme] = useState<Theme>(resolveTheme)
  const [locale, setLocale] = useState<Locale>(getInitialLocale)

  const messages = useMemo(() => getMessages(locale), [locale])
  const { logoutLabel } = messages.auth

  const handleLocaleChange = (nextLocale: Locale) => {
    setLocale(nextLocale)
    setActiveLocale(nextLocale)
  }

  const handleThemeChange = (nextTheme: Theme) => {
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  const handleLogoutClick = () => logoutAndRedirect(window.location.hostname)

  return (
    <AdminMessagesContext.Provider value={messages}>
      <div className="admin-shell min-h-screen flex flex-col bg-[var(--color-admin-bg)] text-foreground">
        <AdminTopBar
          locale={locale}
          theme={theme}
          logoutLabel={showLogout ? logoutLabel : undefined}
          onLogout={showLogout ? handleLogoutClick : undefined}
          onToggleLocale={() => handleLocaleChange(locale === 'nl' ? 'en' : 'nl')}
          onToggleTheme={() => handleThemeChange(theme === 'light' ? 'dark' : 'light')}
        />
        {header && (
          <div>
            {header}
          </div>
        )}
        <div className="bg-background flex overflow-hidden">
          <main className={getMainClassName(mainClassName)}>{children}</main>

          {sidebar && (
            <div className='flex'>
              {sidebar}
            </div>
          )}
        </div>
        {showFooter ? <AdminFooter /> : null}
      </div>
    </AdminMessagesContext.Provider>
  )
}

export default AdminLayout