import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLayout from './AdminLayout'

vi.mock('./AdminTopBar', () => ({
  default: ({ logoutLabel }: { logoutLabel?: string }) => <div>{logoutLabel ?? 'topbar'}</div>,
}))

vi.mock('./AdminFooter', () => ({
  default: () => <div>footer</div>,
}))

vi.mock('../../i18n', () => ({
  getActiveLocale: () => 'nl',
  getMessages: () => ({
    auth: {
      adminLabel: 'Beheerder',
      navigationTitle: 'Navigatie',
      dashboardLabel: 'Dashboard',
      productionsLabel: 'Producties',
      statisticsLabel: 'Statistieken',
      archiveLabel: 'Archief',
      logoutLabel: 'Afmelden',
      localeToggleLabel: 'Wijzig taal',
    },
    footer: {
      privacy: 'Privacy',
      cookies: 'Cookies',
      disclaimer: 'Disclaimer',
      rights: 'Alle rechten voorbehouden',
    },
  }),
  setActiveLocale: vi.fn(),
}))

describe('AdminLayout', () => {
  beforeEach(() => {
    window.history.replaceState(window.history.state, '', '/admin')
    document.documentElement.dataset.theme = 'light'
    localStorage.setItem('locale', 'nl')
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

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Afmelden')).toBeInTheDocument()
    expect(screen.getByText('footer')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('admin-shell', 'min-h-screen', 'flex', 'flex-col')
  })

  it('can hide the footer for the login page shell', () => {
    render(
      <MemoryRouter>
        <AdminLayout showFooter={false}>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('footer')).not.toBeInTheDocument()
    expect(screen.getByText('Afmelden')).toBeInTheDocument()
  })

})
