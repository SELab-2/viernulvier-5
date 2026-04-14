import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminLayout from './AdminLayout'

const adminTopBarProps = vi.hoisted(() => ({
  current: null as null | {
    locale: string
    theme: string
    logoutLabel?: string
    onLogout?: () => void
    onToggleLocale: () => void
    onToggleTheme: () => void
  },
}))
const clearPrimedAdminSessionMock = vi.hoisted(() => vi.fn())
const getActiveLocaleMock = vi.hoisted(() => vi.fn())
const setActiveLocaleMock = vi.hoisted(() => vi.fn())

vi.mock('./AdminTopBar', () => ({
  default: ({ locale, theme, logoutLabel, onLogout, onToggleLocale, onToggleTheme }: {
    locale: string
    theme: string
    logoutLabel?: string
    onLogout?: () => void
    onToggleLocale: () => void
    onToggleTheme: () => void
  }) => {
    adminTopBarProps.current = {
      locale,
      theme,
      logoutLabel,
      onLogout,
      onToggleLocale,
      onToggleTheme,
    }

    return (
      <div>
        <span>{`topbar-${locale}-${theme}`}</span>
        {logoutLabel && onLogout ? (
          <button type="button" onClick={onLogout}>{logoutLabel}</button>
        ) : null}
      </div>
    )
  },
}))

vi.mock('./AdminFooter', () => ({
  default: () => <div>footer</div>,
}))

vi.mock('../../auth/primedAdminSession', () => ({
  clearPrimedAdminSession: clearPrimedAdminSessionMock,
}))

vi.mock('../../i18n', () => ({
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
    } as Response)
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
})
