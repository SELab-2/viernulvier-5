import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getBlogsByProductionId } from '../../api/blogs'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const baseBlog = {
    id: 'b1000000-0000-0000-0000-000000000001',
    title: { nl: 'Test blog', en: 'Test blog' },
    content: { nl: 'Inhoud' },
    createdAt: '2026-04-01T10:00:00.000Z',
}

describe('blogs api', () => {
    beforeEach(() => {
        fetchMock.mockReset()
    })

    it('fetches blogs by productionId from the correct endpoint', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: [baseBlog],
                meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
            }),
        } as unknown as Response)

        const result = await getBlogsByProductionId('dab70000-0000-0000-0000-000000000001')

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/blogs?productionId=dab70000-0000-0000-0000-000000000001',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data).toHaveLength(1)
        expect(result.data[0].id).toBe('b1000000-0000-0000-0000-000000000001')
    })

    it('returns an empty list when no blogs are linked to the production', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: [],
                meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
            }),
        } as unknown as Response)

        const result = await getBlogsByProductionId('dab70000-0000-0000-0000-000000000001')

        expect(result.data).toHaveLength(0)
    })

    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: vi.fn().mockResolvedValueOnce({ message: 'Internal server error' }),
        } as unknown as Response)

        await expect(getBlogsByProductionId('dab70000-0000-0000-0000-000000000001')).rejects.toThrow()
    })
})