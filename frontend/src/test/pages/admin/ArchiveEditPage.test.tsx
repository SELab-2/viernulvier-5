import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import ArchiveEditPage from '../../../pages/admin/ArchiveEditPage'
import type { Messages } from '../../../i18n/types'

const mockMessages: Pick<Messages, 'admin' | 'production' | 'event'> = {
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
      itemIdLabel: 'Item-ID:',
    },
  },
  production: {
    dutchOption: 'Dutch',
    englishOption: 'English',
    productionSettingsLabel: 'Production settings',
    statusLabel: 'Status',
    genreLabel: 'Genres',
    tagLabel: 'Tags',
    bannerLabel: 'Banner',
    extraPicturesLabel: 'Extra pictures',
    artistLabel: 'Artist',
    productionEditTitle: 'Edit production',
    productionEditSubTitle: 'Manage details',
    title: 'Title',
    slug: 'Slug',
    content: 'Content',
    back: 'Back',
    saveOnDraft: 'Save as draft',
    publish: 'Publish',
    eventsEditTitle: 'Manage events',
    eventsEditSubTitle: 'Manage events for this production',
    makeEventsLabel: 'Add event',
    eventsDateLabel: 'Date',
    eventsTimeLabel: 'Time',
    eventsLocationLabel: 'Location',
    eventsCommentLabel: 'Comment',
    eventsActionsLabel: 'Actions'
  },
  event: {
    saveButtonLabel: 'Save event',
    editLabel: 'Edit event',
    addLabel: 'Add event',
    timeLabel: 'Time',
    locationLabel: 'Location',
    tagsLabel: 'Tags',
  }
}

vi.mock('../../../i18n', () => ({
    getMessages: () => mockMessages,
    getActiveLocale: () => 'en',
}))

vi.mock('../../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <AdminMessagesContext.Provider value={mockMessages as unknown as Messages}>
      <div>{children}</div>
    </AdminMessagesContext.Provider>
  ),
}))

describe('ArchiveEditPage', () => {
  it('shows the archive id', () => {
    render(
      <MemoryRouter initialEntries={['/admin/archive/42/edit']}>
        <Routes>
          <Route path="/admin/archive/:id/edit" element={<ArchiveEditPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Item-ID:/)).toBeInTheDocument()
    expect(screen.getByText(/42/)).toBeInTheDocument()
  })

  it('renders the page title via i18n', () => {
    render(
      <MemoryRouter initialEntries={['/admin/archive/99/edit']}>
        <Routes>
          <Route path="/admin/archive/:id/edit" element={<ArchiveEditPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Edit archive item' })).toBeInTheDocument()
  })
})
