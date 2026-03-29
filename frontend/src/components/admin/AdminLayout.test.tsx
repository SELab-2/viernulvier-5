import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLayout from './AdminLayout'

vi.mock('./AdminTopBar', () => ({
  default: ({ adminLabel }: { adminLabel: string }) => <div>{adminLabel}</div>,
}))

vi.mock('./AdminFooter', () => ({
  default: ({ navigationTitle }: { navigationTitle: string }) => <div>{navigationTitle}</div>,
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

  it('renders admin copy through the shared shell', () => {
    render(
      <MemoryRouter>
        <AdminLayout>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByText('Beheerder')).not.toBeInTheDocument()
    expect(screen.getByText('Navigatie')).toBeInTheDocument()
  })

})
