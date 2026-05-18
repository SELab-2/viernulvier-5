import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGenresByProductionId } from '../../api/genres'
 
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)
 
const baseGenre = {
    id: 'c1000000-0000-0000-0000-000000000001',
    apiId: null,
    type: 'genre',
    vendor_id: null,
    name: { nl: 'Test genre', en: 'Test genre' },
    slug: { nl: 'test-genre', en: 'test-genre' },
    description: null,
    created_at: '2026-04-01T10:00:00.000Z',
    updated_at: '2026-04-01T10:00:00.000Z',
    links: { self: 'http://localhost:3001/api/v1/archive/genres/c1000000-0000-0000-0000-000000000001' },
}
 
describe('genres api', () => {
    beforeEach(() => {
        fetchMock.mockReset()
    })
 
    it('fetches genres by productionId from the correct endpoint', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: [baseGenre],
                meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
            }),
        } as unknown as Response)
 
        const result = await getGenresByProductionId('dab70000-0000-0000-0000-000000000001')
 
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/genres?productionId=dab70000-0000-0000-0000-000000000001&page=1',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data).toHaveLength(1)
        expect(result.data[0].id).toBe('c1000000-0000-0000-0000-000000000001')
    })
 
    it('returns an empty list when no genres are linked to the production', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: [],
                meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
            }),
        } as unknown as Response)
 
        const result = await getGenresByProductionId('dab70000-0000-0000-0000-000000000001')
 
        expect(result.data).toHaveLength(0)
    })
 
    it('fetches all pages when totalPages is greater than 1', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValueOnce({
                    data: [baseGenre],
                    meta: { total: 2, page: 1, limit: 1, totalPages: 2 },
                }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValueOnce({
                    data: [{ ...baseGenre, id: 'c1000000-0000-0000-0000-000000000002' }],
                    meta: { total: 2, page: 2, limit: 1, totalPages: 2 },
                }),
            } as unknown as Response)
 
        const result = await getGenresByProductionId('dab70000-0000-0000-0000-000000000001')
 
        expect(result.data).toHaveLength(2)
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })
 
    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: vi.fn().mockResolvedValueOnce({ message: 'Internal server error' }),
        } as unknown as Response)
 
        await expect(getGenresByProductionId('dab70000-0000-0000-0000-000000000001')).rejects.toThrow()
    })
})