import type { RefObject } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Theme } from '../../../components/shared/TopBarControls'
import AdminLayout from '../../../components/admin/AdminLayout'

const adminTopBarProps = vi.hoisted(() => ({
  current: null as null | {
    locale: string
    theme: string
    logoutLabel?: string
    onLogout?: () => void
    onToggleLocale: () => void
    onSelectTheme: (theme: Theme) => void
    onOpenSidebar?: () => void
    openSidebarLabel?: string
    openerRef?: RefObject<HTMLButtonElement | null>
  },
}))
const clearPrimedAdminSessionMock = vi.hoisted(() => vi.fn())
const consumePrimedAdminSessionMock = vi.hoisted(() => vi.fn(() => null))
const getActiveLocaleMock = vi.hoisted(() => vi.fn())
const setActiveLocaleMock = vi.hoisted(() => vi.fn())

vi.mock('../../../components/admin/AdminTopBar', () => ({
  default: ({
    locale,
    theme,
    logoutLabel,
    onLogout,
    onToggleLocale,
    onSelectTheme,
    onOpenSidebar,
    openSidebarLabel,
    openerRef,
  }: {
    locale: string
    theme: string
    logoutLabel?: string
    onLogout?: () => void
    onToggleLocale: () => void
    onSelectTheme: (theme: Theme) => void
    onOpenSidebar?: () => void
    openSidebarLabel?: string
    openerRef?: RefObject<HTMLButtonElement | null>
  }) => {
    adminTopBarProps.current = {
      locale,
      theme,
      logoutLabel,
      onLogout,
      onToggleLocale,
      onSelectTheme,
      onOpenSidebar,
      openSidebarLabel,
      openerRef,
    }

    return (
      <div>
        <span>{`topbar-${locale}-${theme}`}</span>
        {logoutLabel && onLogout ? (
          <button type="button" onClick={onLogout}>{logoutLabel}</button>
        ) : null}
        {onOpenSidebar ? (
          <button ref={openerRef} type="button" onClick={onOpenSidebar}>{openSidebarLabel ?? 'Open navigation'}</button>
        ) : null}
        <button type="button" onClick={() => onSelectTheme('dark')}>Select dark</button>
        <button type="button" onClick={() => onSelectTheme('light')}>Select light</button>
      </div>
    )
  },
}))

vi.mock('../../../components/admin/AdminFooter', () => ({
  default: () => <div>footer</div>,
}))

vi.mock('../../../auth/primedAdminSession', () => ({
  clearPrimedAdminSession: clearPrimedAdminSessionMock,
  consumePrimedAdminSession: consumePrimedAdminSessionMock,
}))

vi.mock('../../../auth/useAdminSession', () => ({
  useAdminSession: () => ({
    isLoading: false,
    isAuthenticated: false,
    user: null,
  }),
}))

vi.mock('../../../components/admin/AdminSidebar', () => ({
  default: ({ onClose }: { onClose?: () => void }) => (
    <div>
      AdminSidebar
      {onClose ? <button type="button" onClick={onClose}>Close navigation</button> : null}
    </div>
  ),
}))

vi.mock('../../../i18n', () => ({
  getActiveLocale: getActiveLocaleMock,
  getMessages: (locale: string) => ({
    auth: {
      adminLabel: locale === 'en' ? 'Admin' : 'Beheerder',
      navigationTitle: locale === 'en' ? 'Navigation' : 'Navigatie',
      dashboardLabel: locale === 'en' ? 'Dashboard' : 'Dashboard',
      productionsLabel: locale === 'en' ? 'Productions' : 'Producties',
      statisticsLabel: locale === 'en' ? 'Statistics' : 'Statistieken',
      archiveLabel: locale === 'en' ? 'Archive' : 'Archief',
      logoutLabel: locale === 'en' ? 'Log out' : 'Afmelden',
      localeToggleLabel: locale === 'en' ? 'Switch language' : 'Wijzig taal',
    },
    footer: {
      privacy: 'Privacy',
      cookies: 'Cookies',
      disclaimer: 'Disclaimer',
      rights: 'Alle rechten voorbehouden',
    },
    admin: {
      themeToggleDark: 'Donkere modus',
      themeToggleLight: 'Lichte modus',
      localeToggleAriaLabel: 'Wissel taal',
      openSidebarLabel: 'Open navigatie',
      closeSidebarLabel: 'Sluit navigatie',
      navigationDrawerLabel: 'Navigatiemenu',
    },
  }),
  setActiveLocale: setActiveLocaleMock,
}))

describe('AdminLayout', () => {
  beforeEach(() => {
    adminTopBarProps.current = null
    clearPrimedAdminSessionMock.mockReset()
    getActiveLocaleMock.mockReset()
    getActiveLocaleMock.mockReturnValue('nl')
    setActiveLocaleMock.mockReset()
    window.history.replaceState(window.history.state, '', '/admin')
    document.documentElement.lang = 'nl'
    document.documentElement.dataset.theme = 'light'
    localStorage.setItem('locale', 'nl')
    localStorage.setItem('theme', 'light')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the footer by default and keeps the shell full height', () => {
    const { container } = render(
      <MemoryRouter>
        <AdminLayout>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    const main = container.querySelector('main')

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Afmelden')).toBeInTheDocument()
    expect(screen.getByText('footer')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('admin-shell', 'min-h-screen', 'flex', 'flex-col')
    expect(main).toHaveClass('flex-1')
  })

  it('can hide the footer and logout action for the login page shell', () => {
    render(
      <MemoryRouter>
        <AdminLayout showFooter={false} showLogout={false}>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('footer')).not.toBeInTheDocument()
    expect(screen.queryByText('Afmelden')).not.toBeInTheDocument()
  })

  it('initializes locale and theme from the active locale helper and document theme', () => {
    getActiveLocaleMock.mockReturnValue('en')
    document.documentElement.dataset.theme = 'dark'

    render(
      <MemoryRouter>
        <AdminLayout>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(getActiveLocaleMock).toHaveBeenCalledWith('/admin')
    expect(adminTopBarProps.current).toMatchObject({
      locale: 'en',
      theme: 'dark',
      logoutLabel: 'Log out',
    })
  })

  it('logs out through the auth api and returns to the admin login route', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValueOnce({ data: { success: true } }),
    } as unknown as Response)
    const assignMock = vi.fn()

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('location', {
      ...window.location,
      hostname: 'localhost',
      pathname: '/admin/dashboard',
      search: '',
      hash: '',
      assign: assignMock,
    } as Location)

    render(
      <MemoryRouter>
        <AdminLayout>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Afmelden' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/auth/logout',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      )
      expect(clearPrimedAdminSessionMock).toHaveBeenCalledTimes(1)
      expect(assignMock).toHaveBeenCalledWith('/admin/login')
    })
  })

  it('redirects to the login route even when the logout request fails', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network error'))
    const assignMock = vi.fn()

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('location', {
      ...window.location,
      hostname: 'localhost',
      pathname: '/admin/dashboard',
      search: '',
      hash: '',
      assign: assignMock,
    } as Location)

    render(
      <MemoryRouter>
        <AdminLayout>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Afmelden' }))

    await waitFor(() => {
      expect(clearPrimedAdminSessionMock).toHaveBeenCalledTimes(1)
      expect(assignMock).toHaveBeenCalledWith('/admin/login')
    })
  })

  it('renders admin copy through the shared shell and sidebar defaults', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('AdminSidebar')).toBeInTheDocument()
    expect(screen.getByText('footer')).toBeInTheDocument()
  })

  it('does not render sidebar when showSidebar is false', () => {
    render(
      <MemoryRouter>
        <AdminLayout>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('AdminSidebar')).not.toBeInTheDocument()
  })

  it('opens the mobile sidebar overlay when the open button is clicked', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getAllByText('AdminSidebar')).toHaveLength(1)

    fireEvent.click(screen.getByText('Open navigatie'))

    expect(screen.getByText('Close navigation')).toBeInTheDocument()
  })

  it('closes the mobile sidebar when the close button is clicked', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Open navigatie'))
    expect(screen.getByText('Close navigation')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Close navigation'))
    expect(screen.queryByText('Close navigation')).not.toBeInTheDocument()
  })

  it('mobile drawer has dialog role and aria-modal when open', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Open navigatie'))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('mobile drawer aria-label is the drawer title, not the opener button label', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Open navigatie'))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', 'Navigatiemenu')
    expect(dialog).not.toHaveAttribute('aria-label', 'Open navigatie')
  })

  it('focus returns to the opener button after the drawer closes via the close button', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    const opener = screen.getByText('Open navigatie')
    fireEvent.click(opener)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Close navigation'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(opener)
  })

  it('focus returns to the opener button after the drawer closes via Escape', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    const opener = screen.getByText('Open navigatie')
    fireEvent.click(opener)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(opener)
  })

  it('Tab key wraps from last focusable element back to the first inside the drawer', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Open navigatie'))

    const closeBtn = screen.getByText('Close navigation')
    closeBtn.focus()
    expect(document.activeElement).toBe(closeBtn)

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false })
    expect(document.activeElement).toBe(closeBtn)
  })

  it('Shift+Tab wraps from the first focusable element to the last inside the drawer', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Open navigatie'))

    const closeBtn = screen.getByText('Close navigation')
    closeBtn.focus()
    expect(document.activeElement).toBe(closeBtn)

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(closeBtn)
  })

  it('closes the mobile drawer when Escape is pressed', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Open navigatie'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('close button inside mobile drawer is visible (not sr-only)', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Open navigatie'))

    const closeBtn = screen.getByText('Close navigation')
    expect(closeBtn).toBeVisible()
  })

  it('selectTheme applies explicit theme — clicking dark sets dark, clicking light sets light', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Select dark'))
    expect(document.documentElement.dataset.theme).toBe('dark')

    fireEvent.click(screen.getByText('Select light'))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('selectTheme is idempotent — applying same theme twice does not toggle', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    document.documentElement.dataset.theme = 'light'
    fireEvent.click(screen.getByText('Select light'))
    expect(document.documentElement.dataset.theme).toBe('light')

    fireEvent.click(screen.getByText('Select light'))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})