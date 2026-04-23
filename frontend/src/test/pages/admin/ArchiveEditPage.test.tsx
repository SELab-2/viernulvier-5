import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import ArchiveEditPage from '../../../pages/admin/ArchiveEditPage'
import type { Messages } from '../../../i18n/types'

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
      blogs: 'Blogs',
      gallery: 'Gallery',
      organisation: 'Organisation',
      settings: 'Settings',
      dashboardIconAlt: 'Dashboard icon',
      productionsIconAlt: 'Productions icon',
      blogsIconAlt: 'Blogs icon',
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
      actionDelete: 'Delete',
      emptyRecent: 'No recent archive items found.',
      paginationShowing: (from: number, to: number, total: number) => `Showing ${from}-${to} of ${total} results`,
      paginationPrev: 'Previous page',
      paginationNext: 'Next page',
      notSyncedYet: 'Not yet synced',
      lastSync: 'last sync',
      syncStatusPending: 'sync status pending',
      visitorsPlaceholder: 'Coming soon',
      visitorsNote: 'analytics coming later',
      visitorsChange: 'placeholder',
      editorsActive: (count: number) => `${count} editors active`,
      statProductions: 'Productions',
      statBlogConcepts: 'Blog Concepts',
      statVisitors: 'Visitors',
      statMediaItems: 'Media Items',
      deltaVsLastMonth: 'vs last month',
      statLastSync: 'last sync',
      statSyncPending: 'sync status pending',
      languageStatusComplete: 'Translation complete',
      languageStatusAttention: 'Translation needs attention',
      languageStatusMissing: 'Translation missing',
      pageSizeLabel: 'Per page',
      pageSizeAuto: 'Auto',
    },
    archiveEdit: {
      pageTitle: 'Edit archive item',
      itemIdLabel: 'Item ID:',
    },
  },
}

vi.mock('../../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <AdminMessagesContext.Provider value={mockMessages as unknown as Messages}>
      <div>{children}</div>
    </AdminMessagesContext.Provider>
  ),
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