import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBlogDrafts } from '../../../components/admin/hooks/useBlogDrafts'

const apiGetMock = vi.hoisted(() => vi.fn())

vi.mock('../../../api/client', () => ({
    api: {
        get: apiGetMock,
    },
}))

describe('useBlogDrafts', () => {
    afterEach(() => {
        apiGetMock.mockReset()
    })

    it('requests the blog drafts from the versioned archive endpoint', async () => {
        apiGetMock.mockResolvedValueOnce({
            data: [],
        })

        renderHook(() => useBlogDrafts({ page: 1, limit: 10 }))

        await waitFor(() => {
            expect(apiGetMock).toHaveBeenCalledWith('/archive/blogs?draft=true&page=1&limit=10')
        })
    })
})