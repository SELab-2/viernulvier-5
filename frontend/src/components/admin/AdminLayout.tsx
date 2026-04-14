import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { logoutAdmin } from '../../api/adminAuth'
import { getAdminRouteConfig } from '../../admin/paths'
import { clearPrimedAdminSession } from '../../auth/primedAdminSession'
import { getActiveLocale, getMessages, setActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'
import type { Theme } from '../shared/TopBarControls'
import AdminFooter from './AdminFooter'
import { AdminMessagesContext } from './AdminMessagesContext'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'

type AdminLayoutProps = {
  children: React.ReactNode
  showFooter?: boolean
  mainClassName?: string
  showLogout?: boolean
  userName?: string
  userRole?: string
  showSidebar?: boolean
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getMainClassName(mainClassName = ''): string {
  return ['min-w-0', 'flex-1', mainClassName].filter(Boolean).join(' ')
}

function getInitialLocale(): Locale {
  return getActiveLocale(window.location.pathname)
}

function resolveTheme(): Theme {
  const explicitTheme = document.documentElement.dataset.theme
  if (explicitTheme === 'light' || explicitTheme === 'dark') {
    return explicitTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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
  mainClassName = '',
  showLogout = true,
  userName = 'Artevelde stagiair',
  userRole = 'Administrator',
  showSidebar = false,
}: AdminLayoutProps) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale)
  const [theme, setTheme] = useState<Theme>(resolveTheme)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const messages = useMemo(() => getMessages(locale), [locale])

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!drawerRef.current) {
      return []
    }

    return Array.from(drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  }, [])

  const openMobileSidebar = () => setMobileSidebarOpen(true)

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false)
    openerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileSidebar()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileSidebarOpen, closeMobileSidebar, getFocusableElements])

  useEffect(() => {
    if (!mobileSidebarOpen || !drawerRef.current) {
      return
    }

    const focusable = drawerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    focusable?.focus()
  }, [mobileSidebarOpen])

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
          logoutLabel={showLogout ? messages.auth.logoutLabel : undefined}
          onLogout={showLogout ? handleLogoutClick : undefined}
          onToggleLocale={() => handleLocaleChange(locale === 'nl' ? 'en' : 'nl')}
          onSelectTheme={handleThemeChange}
          themeToggleDark={messages.admin.themeToggleDark}
          themeToggleLight={messages.admin.themeToggleLight}
          localeToggleAriaLabel={messages.admin.localeToggleAriaLabel}
          showSidebar={showSidebar}
          onOpenSidebar={showSidebar ? openMobileSidebar : undefined}
          openSidebarLabel={messages.admin.openSidebarLabel}
          openerRef={openerRef}
        />

        <div className={['flex w-full items-stretch flex-1', showSidebar ? 'lg:min-h-[calc(100vh-4.5rem)]' : ''].filter(Boolean).join(' ')}>
          {showSidebar ? (
            <div className="hidden lg:flex lg:shrink-0">
              <AdminSidebar userName={userName} userRole={userRole} />
            </div>
          ) : null}

          {showSidebar && mobileSidebarOpen ? (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                aria-hidden="true"
                onClick={closeMobileSidebar}
              />
              <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label={messages.admin.navigationDrawerLabel}
                className="fixed inset-y-0 left-0 z-50 flex lg:hidden"
              >
                <AdminSidebar
                  userName={userName}
                  userRole={userRole}
                  onClose={closeMobileSidebar}
                />
              </div>
            </>
          ) : null}

          <main className={getMainClassName(mainClassName)}>{children}</main>
        </div>

        {showFooter ? <AdminFooter /> : null}
      </div>
    </AdminMessagesContext.Provider>
  )
}

export default AdminLayout
