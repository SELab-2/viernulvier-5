import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from './DashboardPage'

const useDashboardSummaryMock = vi.hoisted(() => vi.fn())
const adminLayoutMock = vi.hoisted(() => vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>))

vi.mock('../../components/admin/AdminLayout', () => ({
  default: (props: { children: React.ReactNode }) => adminLayoutMock(props),
}))

vi.mock('../../components/admin/useDashboardSummary', () => ({
  useDashboardSummary: () => useDashboardSummaryMock(),
}))

vi.mock('../../components/admin/AdminMessagesContext', () => ({
  useAdminMessages: () => ({
    admin: {
      dashboard: {
        pageTitle: 'Dashboard',
        pageSubtitle: 'Overview of archive activity.',
        pageNote: 'Visitor insights are a placeholder.',
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
    },
  }),
}))

describe('DashboardPage', () => {
  it('renders loading state and heading', () => {
    useDashboardSummaryMock.mockReturnValue({
      summary: null,
      isLoading: true,
      error: null,
    })

    render(<DashboardPage />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview of archive activity.')).toBeInTheDocument()
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    expect(screen.getByText('Visitors')).toBeInTheDocument()
  })

  it('renders live summary data', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 1284,
          events: 42,
          mediaItems: 8492,
          editors: 3,
        },
        lastScrapedAt: '2026-03-03T00:00:00.000Z',
        recentItems: [
          {
            id: '1',
            title: 'SNOBS: Editie #11',
            type: 'Productie',
            status: 'available',
            languageStatus: {
              nl: 'complete',
              en: 'attention',
            },
            updatedAt: '2026-03-03T00:00:00.000Z',
          },
        ],
      },
    })

    render(<DashboardPage />)

    expect(screen.getByText('1.284')).toBeInTheDocument()
    expect(screen.getByText('SNOBS: Editie #11')).toBeInTheDocument()
    expect(screen.getByText('Available in archive')).toBeInTheDocument()
    expect(adminLayoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userRole: '3 editors active',
      }),
    )
  })

  it('renders empty state when no recent items exist', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 0,
          events: 0,
          mediaItems: 0,
          editors: 0,
        },
        lastScrapedAt: null,
        recentItems: [],
      },
    })

    render(<DashboardPage />)

    expect(screen.getByText('No recent archive items found.')).toBeInTheDocument()
  })

  it('renders error state when dashboard fetch fails', () => {
    useDashboardSummaryMock.mockReturnValue({
      summary: null,
      isLoading: false,
      error: 'Dashboard kon niet geladen worden.',
    })

    render(<DashboardPage />)

    expect(screen.getByText('Dashboard kon niet geladen worden.')).toBeInTheDocument()
  })
})
