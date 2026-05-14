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
      posters: 'Posters',
      gallery: 'Gallery',
      organisation: 'Organisation',
      settings: 'Settings',
      dashboardIconAlt: 'Dashboard icon',
      productionsIconAlt: 'Productions icon',
      blogsIconAlt: 'Blogs icon',
      postersIconAlt: 'Posters icon',
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
      tableColLanguage: 'Language Status',
      tableColDate: 'Date',
      tableColActions: 'Actions',
      actionView: 'View',
      actionEdit: 'Edit',
      actionDelete: 'delete',
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
    blogsPage: {
      pageTitle: 'Blogs',
      pageSubtitle: 'Overview of all blog posts.',
      searchPlaceholder: 'Search by title...',
      newButton: 'New Blog',
      deleteError: 'Failed to delete. Please try again.',
      loadError:'Could not load blogs.',
      paginationShowing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} results`,
      paginationPageLabel: (page: number) => `Page ${page}`,
      tableColLinkedProductions: 'Linked productions',
      untitledLabel: 'Untitled production',
      productionCountSingular: '1 production',
      productionCountPlural: (count: number) => `${count} productions`,
    },
    productions: {
      pageTitle: 'Productions',
      pageSubtitle: 'Overview of all archived and current productions.',
      searchPlaceholder: 'Search by title, artist or genre...',
      newButton: 'New Production',
      deleteConfirm: 'Are you sure you want to delete this production?',
      deleteError: 'Failed to delete. Please try again.',
      tabAll: 'All',
      tabPublished: 'Published',
      tabConcepts: 'Concepts',
      tabAriaLabel: 'Productions filter',
      untitledLabel: '(Untitled)',
      paginationShowing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} results`,
      paginationPageLabel: (page: number) => `Page ${page}`,
    },
    posters: {
      pageTitle: 'Posters',
      pageSubtitle: 'Manage posters',
      formTitleLabel: 'Title',
      formProductionLabel: 'Production',
      formFileLabel: 'File',
      formFileHint: 'Allowed formats: JPG, PNG, WEBP, GIF, PDF. Maximum file size: 15 MB per file.',
      addFileButton: 'Add files',
      submitButton: 'Create poster',
      submittingButton: 'Creating...',
      overviewHeading: 'Poster overview',
      searchPlaceholder: 'Search posters',
      searchButton: 'Search',
      loadingMessage: 'Loading posters...',
      emptyMessage: 'No posters found.',
      noProductionsAvailable: 'No productions available.',
      searchProductionPlaceholder: 'Search production',
      noProductionsFound: 'No productions found.',
      deleteButton: 'Delete',
      deletingButton: 'Deleting...',
      deleteConfirm: 'Are you sure?',
      deleteError: 'Could not delete poster.',
      validationTitleRequired: 'Title is required.',
      validationProductionRequired: 'Production is required.',
      validationFileRequired: 'File is required.',
      validationInvalidFileType: 'Some files are not supported',
      loadPostersError: 'Could not load posters.',
      loadProductionsError: 'Could not load productions.',
      noProductionAssigned: 'No production assigned',
      filesSelectedCount: (count: number) => `${count} file${count === 1 ? '' : 's'} selected`,
      filesCountLabel: (count: number) => `${count} file${count === 1 ? '' : 's'}`,
      pdfPreviewTitle: (title: string) => `${title} PDF preview`,
    },
  },
}

vi.mock('../../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <AdminMessagesContext.Provider value={mockMessages as Messages}>
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