import { useCallback, useMemo, useRef, useState } from 'react'
import { logoutAndRedirect } from '../../auth/adminLogout'
import { getMessages } from '../../i18n'
import AdminFooter from './AdminFooter'
import { AdminMessagesContext } from './AdminMessagesContext'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'
import { useFocusTrap } from './useFocusTrap'
import { useLocale } from './useLocale'
import { useTheme } from './useTheme'

type AdminLayoutProps = {
  children: React.ReactNode
  showFooter?: boolean
  mainClassName?: string
  showLogout?: boolean
  userName?: string
  userRole?: string
  showSidebar?: boolean
}

function getMainClassName(mainClassName = ''): string {
  return ['min-w-0', 'flex-1', mainClassName].filter(Boolean).join(' ')
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
  const { locale, handleLocaleChange } = useLocale()
  const { theme, handleThemeChange } = useTheme()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const messages = useMemo(() => getMessages(locale), [locale])

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false)
    openerRef.current?.focus()
  }, [])

  useFocusTrap({
    containerRef: drawerRef,
    active: mobileSidebarOpen,
    onDeactivate: closeMobileSidebar,
  })

  const openMobileSidebar = () => setMobileSidebarOpen(true)

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
