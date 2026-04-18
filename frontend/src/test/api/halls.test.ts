import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHallById } from '../../api/halls'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

describe('halls api', () => {
    beforeEach(() => {
        fetchMock.mockReset()
    })

    it('fetches a hall by id from the correct endpoint', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: {
                    id: '214a0000-0000-0000-0000-000000000001',
                    name: { nl: 'Theaterzaal', fr: 'THEATERZAAL', en: 'THEATERZAAL' },
                    space_id: '43ed0000-0000-0000-0000-000000000001',
                },
            }),
        } as unknown as Response)

        const result = await getHallById('214a0000-0000-0000-0000-000000000001')

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/halls/214a0000-0000-0000-0000-000000000001',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data.id).toBe('214a0000-0000-0000-0000-000000000001')
        expect(result.data.space_id).toBe('43ed0000-0000-0000-0000-000000000001')
    })

    it('handles a hall without a space_id', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: {
                    id: '214a0000-0000-0000-0000-000000000001',
                    name: { nl: 'Theaterzaal' },
                    space_id: null,
                },
            }),
        } as unknown as Response)

        const result = await getHallById('214a0000-0000-0000-0000-000000000001')

        expect(result.data.space_id).toBeNull()
    })

    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: vi.fn().mockResolvedValueOnce({ message: 'Not found' }),
        } as unknown as Response)

        await expect(getHallById('214a0000-0000-0000-0000-000000000001')).rejects.toThrow()
    })
})
