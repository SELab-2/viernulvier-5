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

describe('DashboardPage', () => {
  it('renders loading state and heading', () => {
    useDashboardSummaryMock.mockReturnValue({
      summary: null,
      isLoading: true,
      error: null,
    })

    render(<DashboardPage />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Dashboard wordt geladen...')).toBeInTheDocument()
    expect(screen.getByText('Bezoekers')).toBeInTheDocument()
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
    expect(screen.getByText('Beschikbaar in archief')).toBeInTheDocument()
    expect(adminLayoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userRole: '3 editors actief',
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

    expect(screen.getByText('Nog geen recente archiefitems gevonden.')).toBeInTheDocument()
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
