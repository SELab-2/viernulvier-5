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
      posters: 'Posters',
      gallery: 'Gallery',
      settings: 'Settings',
      dashboardIconAlt: 'Dashboard icon',
      productionsIconAlt: 'Productions icon',
      postersIconAlt: 'Posters icon',
      galleryIconAlt: 'Gallery icon',
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
      tableColLanguage: 'Language Status',
      tableColDate: 'Date',
      tableColActions: 'Actions',
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
    notFound: {
      titleTop: 'Four',
      titleAccent: 'zero',
      titleBottom: 'four',
      joke: 'Coincidence? We don\'t think so. Our name is literally a 404.',
      description: 'This admin page doesn\'t exist.',
      dashboardButton: 'back to dashboard',
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

  production: {
    productionSettingsLabel: 'Production Settings',
    statusLabel: 'Status',
    genreLabel: 'Genres',
    tagLabel: 'Tags',
    bannerLabel: 'Banner',
    extraPicturesLabel: 'Extra pictures',
    addGenrePlaceholder: 'Add genre...',
    addTagPlaceholder: 'Add tag...',
    chooseFilePlaceholder: 'Choose file',
    artistLabel: 'Artist',
    dutchOption: 'Dutch',
    englishOption: 'English',
    productionEditTitle: 'Edit production',
    productionEditSubTitle: 'Manage archive details and translation for this event',
    contentLabels: {
      super_title: 'Super title',
      title: 'Title',
      artist: 'Artist',
      teaser: 'Teaser',
      description: 'Description',
      description_2: 'Second Description'
    },
    back: '← Back to overview',
    saveOnDraft: 'Save as draft',
    publish: 'Publish',
    eventsEditTitle: 'Manage events',
    eventsEditSubTitle: 'Manage events for this production',
    makeEventsLabel: 'Add event',
    eventsDateLabel: 'Date',
    eventsTimeLabel: 'Time',
    eventsLocationLabel: 'Location',
    eventsCommentLabel: 'Comment',
    eventsActionsLabel: 'Actions',
    invalidProductionError: 'Fill in all required fields in atleast one language'
  },
  event: {
    saveButtonLabel: 'Save event',
    editLabel: 'Edit event',
    addLabel: 'Add event',
    timeLabel: 'Time (start - end)',
    locationLabel: 'Location',
    commentLabel: 'Comment',
  },
}

vi.mock('../../../i18n', () => ({
    getMessages: () => mockMessages,
    getActiveLocale: () => 'en',
}))

vi.mock('../../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <AdminMessagesContext.Provider value={mockMessages as Messages}>
      <div>{children}</div>
    </AdminMessagesContext.Provider>
  ),
}))

describe('ArchiveEditPage', () => {
  it('Shows create page', () => {
    render(
      <MemoryRouter initialEntries={['/admin/productions/new']}>
        <Routes>
          <Route path="/admin/productions/new" element={<ArchiveEditPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(mockMessages.production.contentLabels.super_title)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.contentLabels.title)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.contentLabels.artist)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.contentLabels.teaser)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.contentLabels.description)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.contentLabels.description_2)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.genreLabel)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.tagLabel)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.bannerLabel)).toBeInTheDocument()
    expect(screen.getByText(mockMessages.production.extraPicturesLabel)).toBeInTheDocument()
  })
})
