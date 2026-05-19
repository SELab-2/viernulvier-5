import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useProductionDrafts } from '../../../components/admin/hooks/useProductionDrafts'

const apiGetMock = vi.hoisted(() => vi.fn())

vi.mock('../../../api/client', () => ({
    api: {
        get: apiGetMock,
    },
}))

describe('useProductionDrafts', () => {
    afterEach(() => {
        apiGetMock.mockReset()
    })

    it('requests the production drafts from the versioned archive endpoint', async () => {
        apiGetMock.mockResolvedValueOnce({
            data: [],
        })

        renderHook(() => useProductionDrafts({ page: 1, limit: 10 }))

        await waitFor(() => {
            expect(apiGetMock).toHaveBeenCalledWith('/archive/productions?draft=true&page=1&limit=10')
        })
    })
})