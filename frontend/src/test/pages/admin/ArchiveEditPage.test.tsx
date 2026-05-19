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
      blogs: 'Blogs',
      posters: 'Posters',
      gallery: 'Gallery',
      settings: 'Settings',
      drafts: 'Drafts',
      dashboardIconAlt: 'Dashboard icon',
      productionsIconAlt: 'Productions icon',
      blogsIconAlt: 'Blogs icon',
      postersIconAlt: 'Posters icon',
      settingsIconAlt: 'Settings icon',
      draftsIconAlt: 'Drafts icon',
    },
    dashboard: {
      pageTitle: 'Dashboard',
      pageSubtitle: 'Here is an overview of the latest archive activity and metadata status.',
      pageNote: 'Visitor insights are a placeholder until the analytics integration is ready.',
      loadingMessage: 'Loading dashboard...',
      recentlyEdited: 'Recently edited',
      tableColTitle: 'Title',
      tableColLanguage: 'Language Status',
      tableColType: 'Type',
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
      statBlogConcepts: 'Blogs',
      statVisitors: 'Visitors',
      statPosters: 'Posters',
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
      tabAriaLabel: 'Productions filter',
      untitledLabel: '(Untitled)',
      paginationShowing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} results`,
      paginationPageLabel: (page: number) => `Page ${page}`,
      loadError: 'Could not load productions.',
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
    cancelLabel: 'Cancel',
    newLocationButton: '+ new location',
    newLocationNamePlaceholder: 'Name',
    newLocationAddressPlaceholder: 'Address',
    newLocationValidationError: 'Name and address are required.',
    newLocationCreateError: 'Failed to create location.',
    newLocationCreatingLabel: 'Creating...',
    newLocationAddLabel: 'Add location',
  },
    drafts: {
      pageTitle: 'Drafts',
      pageSubtitle: 'View all drafts here',
      productions: 'Productions',
      blogs: 'Blogs',
      filterOnlyCurrent: 'Show my drafts',
      tableColTitle: 'Title',
      tableColType: 'Type',
      tableColStatus: 'Status',
      tableColEditor: 'Edited by me',
      tableColDate: 'Date',
      tableColActions: 'Actions',
      statusUnavailable: 'Not yet available in archive',
      actionView: 'View',
      actionEdit: 'Edit',
      actionDelete: 'Delete',
      emptyRecent: 'No recent archive drafts found.',
      loadingMessage: 'Loading drafts...',
      deleteTitle: 'Delete draft',
      deleteConfirm: (title: string) => `Are you sure you want to delete "${title}"?`,
      paginationShowing: (from: number, to: number, total: number) => `Showing ${from}-${to} of ${total} results`,
      pageSizeLabel: 'Per page',
      paginationPrev: 'Previous page',
      paginationNext: 'Next page',
    }
  }
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
