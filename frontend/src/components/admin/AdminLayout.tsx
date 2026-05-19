import { useCallback, useMemo, useRef, useState } from 'react'
import type { SessionUser } from '../../api/adminAuth'
import { useOptionalAdminSession } from '../../auth/useAdminSessionContext'
import { logoutAndRedirect } from '../../auth/adminLogout'
import { getMessages } from '../../i18n'
import AdminFooter from './AdminFooter'
import { AdminMessagesContext } from './AdminMessagesContext'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'
import SettingsModal from './SettingsModal'
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
  userName,
  userRole,
  showSidebar = false,
}: AdminLayoutProps) {
  const { locale, handleLocaleChange } = useLocale()
  const { theme, handleThemeChange } = useTheme()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const session = useOptionalAdminSession()
  const contextUser = showSidebar ? session?.user ?? null : null
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(contextUser)
  const [prevUser, setPrevUser] = useState<SessionUser | null>(contextUser)
  const messages = useMemo(() => getMessages(locale), [locale])

  if (prevUser !== contextUser) {
    setPrevUser(contextUser)
    setSessionUser(contextUser)
  }

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
  const sidebarUserName = sessionUser?.username ?? userName ?? ''
  const sidebarUserRole = sessionUser?.role ?? userRole ?? ''

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
          showSidebar={showSidebar}
          onOpenSidebar={showSidebar ? openMobileSidebar : undefined}
          openerRef={openerRef}
        />

        <div className={['flex w-full items-stretch flex-1', showSidebar ? 'lg:min-h-[calc(100vh-4.5rem)]' : ''].filter(Boolean).join(' ')}>
          {showSidebar ? (
            <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0 lg:self-start">
              <AdminSidebar
                userName={sidebarUserName}
                userRole={sidebarUserRole}
                onOpenSettings={() => setSettingsOpen(true)}
              />
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
                  userName={sidebarUserName}
                  userRole={sidebarUserRole}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onClose={closeMobileSidebar}
                />
              </div>
            </>
          ) : null}

          <main className={`${getMainClassName(mainClassName)}`}>{children}</main>
        </div>
        {showFooter ? <AdminFooter /> : null}

        {settingsOpen ? (
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            user={sessionUser}
            onUserUpdated={setSessionUser}
          />
        ) : null}
      </div>
    </AdminMessagesContext.Provider>
  )
}

export default AdminLayout
