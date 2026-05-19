import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDashboardSummary } from '../../../components/admin/hooks/useDashboardSummary'

const apiGetMock = vi.hoisted(() => vi.fn())

vi.mock('../../../api/client', () => ({
  api: {
    get: apiGetMock,
  },
}))

describe('useDashboardSummary', () => {
  afterEach(() => {
    apiGetMock.mockReset()
  })

  it('requests the dashboard summary from the versioned dashboard endpoint', async () => {
    apiGetMock.mockResolvedValueOnce({
      data: {
        counts: {
          productions: 1,
          posters: 2,
          blogs: 0,
          mediaItems: 3,
          editors: 4,
        },
        recentItems: [],
        totalRecentItems: 2,
        lastScrapedAt: null,
      },
    })

    renderHook(() => useDashboardSummary({ page: 1, limit: 3 }))

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith('/dashboard/summary?page=1&limit=3')
    })
  })
})
