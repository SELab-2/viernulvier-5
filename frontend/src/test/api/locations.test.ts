import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLocationById } from '../../api/locations'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

describe('locations api', () => {
    beforeEach(() => {
        fetchMock.mockReset()
    })

    it('fetches a location by id from the correct endpoint', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: {
                    id: 'bca70000-0000-0000-0000-000000000001',
                    name: null,
                    street: 'Kerkstraat',
                    number: '1',
                    postal_code: '9000',
                    city: 'Gent',
                    country: 'BE',
                },
            }),
        } as unknown as Response)

        const result = await getLocationById('bca70000-0000-0000-0000-000000000001')

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/locations/bca70000-0000-0000-0000-000000000001',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data.city).toBe('Gent')
        expect(result.data.country).toBe('BE')
    })

    it('handles nullable fields correctly', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: {
                    id: 'bca70000-0000-0000-0000-000000000001',
                    name: null,
                    street: null,
                    number: null,
                    postal_code: null,
                    city: null,
                    country: null,
                },
            }),
        } as unknown as Response)

        const result = await getLocationById('bca70000-0000-0000-0000-000000000001')

        expect(result.data.name).toBeNull()
        expect(result.data.street).toBeNull()
        expect(result.data.city).toBeNull()
    })

    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: vi.fn().mockResolvedValueOnce({ message: 'Not found' }),
        } as unknown as Response)

        await expect(getLocationById('bca70000-0000-0000-0000-000000000001')).rejects.toThrow()
    })
})