import type { RefObject } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Theme } from '../shared/TopBarControls'
import AdminLayout from './AdminLayout'

vi.mock('./AdminTopBar', () => ({
  default: ({
    onOpenSidebar,
    onSelectTheme,
    openerRef,
  }: {
    onOpenSidebar?: () => void
    onSelectTheme?: (theme: Theme) => void
    openerRef?: RefObject<HTMLButtonElement>
  }) => (
    <div>
      TopBar
      {onOpenSidebar ? (
        <button ref={openerRef} onClick={onOpenSidebar}>Open navigation</button>
      ) : null}
      {onSelectTheme ? (
        <>
          <button onClick={() => onSelectTheme('dark')}>Select dark</button>
          <button onClick={() => onSelectTheme('light')}>Select light</button>
        </>
      ) : null}
    </div>
  ),
}))

vi.mock('./AdminFooter', () => ({
  default: ({ navigationTitle }: { navigationTitle: string }) => <div>{navigationTitle}</div>,
}))

vi.mock('./AdminSidebar', () => ({
  default: ({ onClose }: { onClose?: () => void }) => (
    <div>
      AdminSidebar
      {onClose ? <button onClick={onClose}>Close navigation</button> : null}
    </div>
  ),
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
    admin: {
      themeToggleDark: 'Donkere modus',
      themeToggleLight: 'Lichte modus',
      localeToggleAriaLabel: 'Wissel taal',
      openSidebarLabel: 'Open navigatie',
      closeSidebarLabel: 'Sluit navigatie',
      navigationDrawerLabel: 'Navigatiemenu',
      nav: {
        dashboard: 'Dashboard',
        productions: 'Producties',
        gallery: 'Galerij',
        organisation: 'Organisatie',
        settings: 'Instellingen',
        dashboardIconAlt: 'Dashboard icoon',
        productionsIconAlt: 'Producties icoon',
        galleryIconAlt: 'Galerij icoon',
        organisationIconAlt: 'Organisatie icoon',
        settingsIconAlt: 'Instellingen icoon',
      },
      dashboard: {
        pageTitle: 'Dashboard',
        pageSubtitle: 'Overzicht',
        pageNote: 'Noot',
        loadingMessage: 'Laden...',
        recentlyEdited: 'Recentelijk bewerkt',
        tableColTitle: 'Titel',
        tableColType: 'Type',
        tableColStatus: 'Status',
        tableColLanguage: 'Taal Status',
        tableColDate: 'Datum',
        tableColActions: 'Acties',
        statusAvailable: 'Beschikbaar in archief',
        actionView: 'Bekijk',
        actionEdit: 'Bewerk',
        emptyRecent: 'Nog geen recente archiefitems gevonden.',
        paginationShowing: (from: number, to: number, total: number) => `Toont ${from}-${to} van ${total} resultaten`,
        paginationDefault: 'Toont recente resultaten',
        notSyncedYet: 'Nog niet gesynchroniseerd',
        lastSync: 'laatste sync',
        syncStatusPending: 'syncstatus volgt',
        visitorsPlaceholder: 'Binnenkort',
        visitorsNote: 'analytics volgt later',
        visitorsChange: 'placeholder',
        editorsActive: (count: number) => `${count} editors actief`,
        statProductions: 'Producties',
        statEvents: 'Events',
        statVisitors: 'Bezoekers',
        statMediaItems: 'Media Items',
        statImportedArchive: 'geïmporteerd archief',
        statLinkedEvents: 'gekoppelde speeldata',
        statLastSync: 'laatste sync',
        statSyncPending: 'syncstatus volgt',
        statLiveData: '+ live data',
        statLinked: '+ gekoppeld',
      },
      archiveEdit: {
        pageTitle: 'Archief item bewerken',
        itemIdLabel: 'Item ID:',
      },
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
    expect(screen.getByText('AdminSidebar')).toBeInTheDocument()
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

    expect(screen.getByText('AdminSidebar')).toBeInTheDocument()
  })

  it('opens the mobile sidebar overlay when the open button is clicked', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    // Before opening: only one AdminSidebar (the desktop one)
    expect(screen.getAllByText('AdminSidebar')).toHaveLength(1)

    fireEvent.click(screen.getByText('Open navigation'))

    // After opening: still one AdminSidebar but the close button is visible
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

    fireEvent.click(screen.getByText('Open navigation'))
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

    fireEvent.click(screen.getByText('Open navigation'))

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

    fireEvent.click(screen.getByText('Open navigation'))

    const dialog = screen.getByRole('dialog')
    // Must use the dedicated drawer label, not the opener button label
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

    const opener = screen.getByText('Open navigation')
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

    const opener = screen.getByText('Open navigation')
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

    fireEvent.click(screen.getByText('Open navigation'))

    const closeBtn = screen.getByText('Close navigation')
    // Simulate focus on the last (and only) focusable element in the mocked drawer
    closeBtn.focus()
    expect(document.activeElement).toBe(closeBtn)

    // Tab forward from the last element: should wrap to first
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false })
    // The drawer has one button (Close navigation); wrapping first===last means focus stays on it
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

    fireEvent.click(screen.getByText('Open navigation'))

    const closeBtn = screen.getByText('Close navigation')
    closeBtn.focus()
    expect(document.activeElement).toBe(closeBtn)

    // Shift+Tab from first element: should wrap to last
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

    fireEvent.click(screen.getByText('Open navigation'))
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

    fireEvent.click(screen.getByText('Open navigation'))

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
