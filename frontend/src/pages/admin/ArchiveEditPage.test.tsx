import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArchiveEditPage from './ArchiveEditPage'
import type { Messages } from '../../i18n/types'

const mockMessages: Pick<Messages, 'admin'> = {
  admin: {
    themeToggleDark: 'Dark mode',
    themeToggleLight: 'Light mode',
    localeToggleAriaLabel: 'Switch language',
    openSidebarLabel: 'Open navigation',
    closeSidebarLabel: 'Close navigation',
    navigationDrawerLabel: 'Navigation menu',
    nav: {
      dashboard: 'Dashboard',
      productions: 'Productions',
      gallery: 'Gallery',
      organisation: 'Organisation',
      settings: 'Settings',
      dashboardIconAlt: 'Dashboard icon',
      productionsIconAlt: 'Productions icon',
      galleryIconAlt: 'Gallery icon',
      organisationIconAlt: 'Organisation icon',
      settingsIconAlt: 'Settings icon',
    },
    dashboard: {
      pageTitle: 'Dashboard',
      pageSubtitle: 'Here is an overview of the latest archive activity and metadata status.',
      pageNote: 'Visitor insights are a placeholder until the analytics integration is ready.',
      loadingMessage: 'Loading dashboard...',
      recentlyEdited: 'Recently edited',
      tableColTitle: 'Title',
      tableColType: 'Type',
      tableColStatus: 'Status',
      tableColLanguage: 'Language Status',
      tableColDate: 'Date',
      tableColActions: 'Actions',
      statusAvailable: 'Available in archive',
      actionView: 'View',
      actionEdit: 'Edit',
      emptyRecent: 'No recent archive items found.',
      paginationShowing: (from: number, to: number, total: number) => `Showing ${from}-${to} of ${total} results`,
      paginationDefault: 'Showing recent results',
      notSyncedYet: 'Not yet synced',
      lastSync: 'last sync',
      syncStatusPending: 'sync status pending',
      visitorsPlaceholder: 'Coming soon',
      visitorsNote: 'analytics coming later',
      visitorsChange: 'placeholder',
      editorsActive: (count: number) => `${count} editors active`,
      statProductions: 'Productions',
      statEvents: 'Events',
      statVisitors: 'Visitors',
      statMediaItems: 'Media Items',
      statImportedArchive: 'imported archive',
      statLinkedEvents: 'linked play dates',
      statLastSync: 'last sync',
      statSyncPending: 'sync status pending',
      statLiveData: '+ live data',
      statLinked: '+ linked',
    },
    archiveEdit: {
      pageTitle: 'Edit archive item',
      itemIdLabel: 'Item ID:',
    },
  },
}

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../components/admin/AdminMessagesContext', () => ({
  useAdminMessages: () => mockMessages,
}))

describe('ArchiveEditPage', () => {
  it('shows the archive id', () => {
    window.history.replaceState(window.history.state, '', '/admin/archive/42/edit')

    render(
      <MemoryRouter initialEntries={['/admin/archive/42/edit']}>
        <ArchiveEditPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Item ID:/)).toBeInTheDocument()
  })

  it('renders the page title via i18n', () => {
    render(
      <MemoryRouter initialEntries={['/admin/archive/99/edit']}>
        <ArchiveEditPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Edit archive item' })).toBeInTheDocument()
  })
})
