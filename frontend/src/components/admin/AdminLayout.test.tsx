import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLayout from './AdminLayout'

vi.mock('./AdminTopBar', () => ({
  default: () => <div>TopBar</div>,
}))

vi.mock('./AdminFooter', () => ({
  default: ({ navigationTitle }: { navigationTitle: string }) => <div>{navigationTitle}</div>,
}))

vi.mock('../../i18n', () => ({
  getActiveLocale: () => 'nl',
  getMessages: () => ({
    auth: {
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

  it('renders admin copy through the shared shell and sidebar defaults', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Navigatie')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Artevelde stagiair')).toBeInTheDocument()
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
    expect(screen.queryByText('Artevelde stagiair')).not.toBeInTheDocument()
  })

  it('renders overridden sidebar identity when showSidebar is true', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar userName="Liam" userRole="2 editors actief">
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('Liam')).toBeInTheDocument()
    expect(screen.getByText('2 editors actief')).toBeInTheDocument()
  })
})
