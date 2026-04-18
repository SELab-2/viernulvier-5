import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSpaceById } from '../../api/spaces'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

describe('spaces api', () => {
    beforeEach(() => {
        fetchMock.mockReset()
    })

    it('fetches a space by id from the correct endpoint', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: {
                    id: '43ed0000-0000-0000-0000-000000000001',
                    location_id: 'bca70000-0000-0000-0000-000000000001',
                },
            }),
        } as unknown as Response)

        const result = await getSpaceById('43ed0000-0000-0000-0000-000000000001')

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/spaces/43ed0000-0000-0000-0000-000000000001',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data.location_id).toBe('bca70000-0000-0000-0000-000000000001')
    })

    it('handles a space without a location_id', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: {
                    id: '43ed0000-0000-0000-0000-000000000001',
                    location_id: null,
                },
            }),
        } as unknown as Response)

        const result = await getSpaceById('43ed0000-0000-0000-0000-000000000001')

        expect(result.data.location_id).toBeNull()
    })

    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: vi.fn().mockResolvedValueOnce({ message: 'Not found' }),
        } as unknown as Response)

        await expect(getSpaceById('43ed0000-0000-0000-0000-000000000001')).rejects.toThrow()
    })
})