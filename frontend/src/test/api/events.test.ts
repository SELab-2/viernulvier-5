import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getEventsByProductionId } from '../../api/events'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

describe('events api', () => {
    beforeEach(() => {
        fetchMock.mockReset()
    })

    it('fetches events filtered by production id', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: [
                    {
                        id: '435b0000-0000-0000-0000-000000000001',
                        starts_at: '2027-03-06T13:00:00.000Z',
                        ends_at: '2027-03-06T14:15:00.000Z',
                        doors_at: null,
                        info: null,
                        production_id: 'dab70000-0000-0000-0000-000000000001',
                        hall_id: '214a0000-0000-0000-0000-000000000001',
                    },
                ],
            }),
        } as unknown as Response)

        const result = await getEventsByProductionId('dab70000-0000-0000-0000-000000000001')

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/events?production_id=dab70000-0000-0000-0000-000000000001',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data).toHaveLength(1)
        expect(result.data[0].id).toBe('435b0000-0000-0000-0000-000000000001')
        expect(result.data[0].starts_at).toBe('2027-03-06T13:00:00.000Z')
    })

    it('returns an empty array when there are no events', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({ data: [] }),
        } as unknown as Response)

        const result = await getEventsByProductionId('dab70000-0000-0000-0000-000000000001')

        expect(result.data).toHaveLength(0)
    })

    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: vi.fn().mockResolvedValueOnce({ message: 'Internal server error' }),
        } as unknown as Response)

        await expect(getEventsByProductionId('dab70000-0000-0000-0000-000000000001')).rejects.toThrow()
    })
})