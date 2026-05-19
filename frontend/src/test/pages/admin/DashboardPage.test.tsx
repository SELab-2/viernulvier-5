import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import DashboardPage from '../../../pages/admin/DashboardPage'
import {MemoryRouter} from "react-router-dom";

const useDashboardSummaryMock = vi.hoisted(() => vi.fn())
const adminLayoutMock = vi.hoisted(() => vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>))
const mockMessages = vi.hoisted(() => ({
  admin: {
    dashboard: {
      pageTitle: 'Dashboard',
      pageSubtitle: 'Overview of archive activity.',
      pageNote: 'Visitor insights are a placeholder.',
      loadingMessage: 'Loading dashboard...',
      recentlyEdited: 'Recently edited',
      tableColTitle: 'Title',
      tableColType: 'Type',
      tableColLanguage: 'Language Status',
      tableColDate: 'Date',
      tableColActions: 'Actions',
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
  },
}))

vi.mock('../../../components/admin/AdminLayout', () => ({
  default: (props: { children: React.ReactNode }) => {
    adminLayoutMock(props)
    return <AdminMessagesContext.Provider value={mockMessages as unknown as Messages}>{props.children}</AdminMessagesContext.Provider>
  },
}))

vi.mock('../../../components/admin/hooks/useDashboardSummary', () => ({
  useDashboardSummary: (args: { page: number; limit: number }) => useDashboardSummaryMock(args),
}))

const renderDashboard = () =>
    render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>,
    )

describe('DashboardPage', () => {
  it('renders loading state and heading', () => {
    useDashboardSummaryMock.mockReturnValue({
      summary: null,
      isLoading: true,
      error: null,
    })

    renderDashboard()

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview of archive activity.')).toBeInTheDocument()
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    expect(screen.getByText('Posters')).toBeInTheDocument()
  })

  it('renders live summary data', async () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 1284,
          posters: 42,
          blogs: 7,
          mediaItems: 8492,
          editors: 3,
        },
        totalRecentItems: 1,
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
            updated_at: '2026-03-03T00:00:00.000Z',
          },
        ],
      },
    })

    renderDashboard()

    expect(screen.getByText('1.284')).toBeInTheDocument()
    expect(screen.getByText('SNOBS: Editie #11')).toBeInTheDocument()
    await waitFor(() => {
      expect(adminLayoutMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userRole: '3 editors active',
        }),
      )
    })
  })


  it('renders poster stat from summary data with delta', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 10, posters: 12, blogs: 3, mediaItems: 100, editors: 2 },
        totalRecentItems: 0,
        lastScrapedAt: null,
        recentItems: [],
        deltas: {
          productions: { changePct: null, direction: 'flat' },
          blogs: { changePct: null, direction: 'flat' },
          posters: { changePct: 50, direction: 'up' },
        },
      },
    })

    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

    expect(screen.getByText('Posters')).toBeInTheDocument()
    expect(screen.getAllByText('12').some((element) => element.tagName.toLowerCase() === 'p')).toBe(true)
    expect(screen.getByText('+50%')).toBeInTheDocument()
    expect(screen.queryByText('Visitors')).not.toBeInTheDocument()
  })

  it('links dashboard item actions to the matching view and edit routes', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 1, posters: 1, blogs: 1, mediaItems: 0, editors: 0 },
        totalRecentItems: 3,
        lastScrapedAt: null,
        recentItems: [
          {
            id: 'production-1',
            title: 'Production row',
            type: 'Productie',
            status: 'available',
            languageStatus: { nl: 'complete', en: 'complete' },
            updated_at: '2026-01-03T00:00:00.000Z',
          },
          {
            id: 'blog-1',
            title: 'Blog row',
            type: 'Blog',
            status: 'available',
            languageStatus: { nl: 'complete', en: 'complete' },
            updated_at: '2026-01-02T00:00:00.000Z',
          },
          {
            id: 'poster-1',
            title: 'Poster row',
            type: 'Poster',
            status: 'available',
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        deltas: {
          productions: { changePct: null, direction: 'flat' },
          blogs: { changePct: null, direction: 'flat' },
          posters: { changePct: null, direction: 'flat' },
        },
      },
    })

    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

    const productionRow = screen.getByText('Production row').closest('tr')
    const blogRow = screen.getByText('Blog row').closest('tr')
    const posterRow = screen.getByText('Poster row').closest('tr')

    expect(productionRow).not.toBeNull()
    expect(blogRow).not.toBeNull()
    expect(posterRow).not.toBeNull()
    expect(within(productionRow as HTMLElement).getByRole('link', { name: 'View' })).toHaveAttribute('href', '/archive/production-1')
    expect(within(productionRow as HTMLElement).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/admin/archive/production-1/edit')
    expect(within(blogRow as HTMLElement).getByRole('link', { name: 'View' })).toHaveAttribute('href', '/blogs/blog-1')
    expect(within(blogRow as HTMLElement).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/admin/blogs/blog-1/edit')
    expect(within(posterRow as HTMLElement).queryByLabelText(/NL:/)).not.toBeInTheDocument()
    expect(within(posterRow as HTMLElement).queryByLabelText(/EN:/)).not.toBeInTheDocument()
    expect(within(posterRow as HTMLElement).getByRole('link', { name: 'View' })).toHaveAttribute('href', '/posters/poster-1')
    expect(within(posterRow as HTMLElement).getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/admin/posters')
  })

  it('renders empty state when no recent items exist', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 0,
          posters: 0,
          blogs: 0,
          mediaItems: 0,
          editors: 0,
        },
        totalRecentItems: 0,
        lastScrapedAt: null,
        recentItems: [],
      },
    })

    renderDashboard()

    expect(screen.getByText('No recent archive items found.')).toBeInTheDocument()
  })

  it('renders error state when dashboard fetch fails', () => {
    useDashboardSummaryMock.mockReturnValue({
      summary: null,
      isLoading: false,
      error: 'Dashboard kon niet geladen worden.',
    })

    renderDashboard()

    expect(screen.getByText('Dashboard kon niet geladen worden.')).toBeInTheDocument()
  })

  it('renders Blogs label', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 10,
          posters: 5,
          blogs: 3,
          mediaItems: 100,
          editors: 2,
        },
        totalRecentItems: 0,
        lastScrapedAt: null,
        recentItems: [],
        deltas: {
          productions: { changePct: null, direction: 'flat' },
          blogs: { changePct: null, direction: 'flat' },
        },
      },
    })

    renderDashboard()

    expect(screen.getByText('Blogs')).toBeInTheDocument()
  })

  it('productions pill shows +12% with green class when changePct=12 direction=up', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 10, posters: 5, blogs: 3, mediaItems: 100, editors: 2 },
        totalRecentItems: 0,
        lastScrapedAt: null,
        recentItems: [],
        deltas: {
          productions: { changePct: 12, direction: 'up' },
          blogs: { changePct: null, direction: 'flat' },
        },
      },
    })

    renderDashboard()

    const pill = screen.getByText('+12%')
    expect(pill).toBeInTheDocument()
    expect(pill.className).toContain('text-[#10b981]')
  })

  it('productions pill shows -5% when changePct=-5 direction=down', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 10, posters: 5, blogs: 3, mediaItems: 100, editors: 2 },
        totalRecentItems: 0,
        lastScrapedAt: null,
        recentItems: [],
        deltas: {
          productions: { changePct: -5, direction: 'down' },
          blogs: { changePct: null, direction: 'flat' },
        },
      },
    })

    renderDashboard()

    expect(screen.getByText('-5%')).toBeInTheDocument()
  })

  it('productions pill shows em dash and no vs-last-month note when changePct=null', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 10, posters: 5, blogs: 3, mediaItems: 100, editors: 2 },
        totalRecentItems: 0,
        lastScrapedAt: null,
        recentItems: [],
        deltas: {
          productions: { changePct: null, direction: 'flat' },
          blogs: { changePct: null, direction: 'flat' },
        },
      },
    })

    renderDashboard()

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.queryByText('vs last month')).not.toBeInTheDocument()
  })

  it('blogs pill shows 0% when changePct=0 direction=flat', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 10, posters: 5, blogs: 3, mediaItems: 100, editors: 2 },
        totalRecentItems: 0,
        lastScrapedAt: null,
        recentItems: [],
        deltas: {
          productions: { changePct: null, direction: 'flat' },
          blogs: { changePct: 0, direction: 'flat' },
        },
      },
    })

    renderDashboard()

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows pagination meta line when totalRecentItems > 0', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 10,
          posters: 5,
          blogs: 3,
          mediaItems: 100,
          editors: 2,
        },
        totalRecentItems: 7,
        lastScrapedAt: null,
        recentItems: [
          {
            id: '1',
            title: 'Test item',
            type: 'Productie',
            status: 'available',
            languageStatus: { nl: 'complete', en: 'complete' },
            updated_at: '2026-01-01T00:00:00.000Z',
          },
          {
            id: '2',
            title: 'Test item 2',
            type: 'Productie',
            status: 'available',
            languageStatus: { nl: 'complete', en: 'complete' },
            updated_at: '2026-01-01T00:00:00.000Z',
          },
          {
            id: '3',
            title: 'Test item 3',
            type: 'Productie',
            status: 'available',
            languageStatus: { nl: 'complete', en: 'complete' },
            updated_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    })

    renderDashboard()

    expect(screen.getByText('Showing 1-3 of 7 results')).toBeInTheDocument()
  })

  it('does not show pagination meta line when totalRecentItems = 0', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 0,
          posters: 0,
          blogs: 0,
          mediaItems: 0,
          editors: 0,
        },
        totalRecentItems: 0,
        lastScrapedAt: null,
        recentItems: [],
      },
    })

    renderDashboard()

    expect(screen.queryByText(/of \d+ results/)).not.toBeInTheDocument()
  })

  it('renders pagination buttons', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 10,
          posters: 5,
          blogs: 3,
          mediaItems: 100,
          editors: 2,
        },
        totalRecentItems: 7,
        lastScrapedAt: null,
        recentItems: [],
      },
    })

    renderDashboard()

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
  })

  it('clicking page 2 button calls hook with page=2', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: {
          productions: 10,
          posters: 5,
          blogs: 3,
          mediaItems: 100,
          editors: 2,
        },
        totalRecentItems: 7,
        lastScrapedAt: null,
        recentItems: [],
      },
    })

    renderDashboard()

    const page2Button = screen.getByRole('button', { name: '2' })
    fireEvent.click(page2Button)

    expect(useDashboardSummaryMock.mock.calls.some(([args]) => args?.page === 2)).toBe(true)
  })

  it('changing the page-size selector refetches with the new limit and resets to page 1', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 10, posters: 5, blogs: 3, mediaItems: 100, editors: 2 },
        totalRecentItems: 30,
        lastScrapedAt: null,
        recentItems: [],
      },
    })

    useDashboardSummaryMock.mockClear()

    renderDashboard()

    const initialCalls = useDashboardSummaryMock.mock.calls.length
    const select = screen.getByLabelText('Per page') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '9' } })

    const latestCall = useDashboardSummaryMock.mock.calls.at(-1)?.[0]
    expect(useDashboardSummaryMock.mock.calls.length).toBeGreaterThan(initialCalls)
    expect(latestCall).toMatchObject({ page: 1, limit: 9 })
  })

  it('defaults to Auto mode and picks a limit based on viewport height', () => {
    const originalInnerHeight = window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 1200, configurable: true, writable: true })
    window.localStorage.removeItem('admin:dashboard:pageSize')

    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 10, posters: 5, blogs: 3, mediaItems: 100, editors: 2 },
        totalRecentItems: 30,
        lastScrapedAt: null,
        recentItems: [],
      },
    })

    useDashboardSummaryMock.mockClear()

    try {
      renderDashboard()

      const firstCall = useDashboardSummaryMock.mock.calls[0]?.[0]
      expect(firstCall?.limit).toBeGreaterThanOrEqual(9)
      expect(firstCall?.limit).toBeLessThanOrEqual(18)
    } finally {
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true, writable: true })
    }
  })

  it('Prev button is disabled on page 1', () => {
    useDashboardSummaryMock.mockReturnValue({
      isLoading: false,
      error: null,
      summary: {
        counts: { productions: 10, posters: 5, blogs: 3, mediaItems: 100, editors: 2 },
        totalRecentItems: 7,
        lastScrapedAt: null,
        recentItems: [],
      },
    })

    renderDashboard()

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })
})
