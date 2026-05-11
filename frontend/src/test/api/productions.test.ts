import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProductionById } from '../../api/productions'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const baseProduction = {
    id: 'dab70000-0000-0000-0000-000000000001',
    apiId: null,
    vendor_id: null,
    box_office_id: null,
    performer_field: null,
    performer_type: 'group',
    attendance_mode: 'offline',
    super_title: null,
    title: { nl: 'Kapiteinsavond', en: 'Captain Night' },
    artist: { nl: 'Ensemble X' },
    meta_title: null,
    meta_description: null,
    tagline: null,
    teaser: null,
    description: { nl: '<p>Beschrijving</p>' },
    description_extra: null,
    description_2: null,
    video_1: null,
    video_2: null,
    quote: null,
    quote_source: null,
    programme: null,
    info: null,
    description_short: null,
    eticket_info: null,
    custom_data: null,
    media_gallery_id: 'e9e00000-0000-0000-0000-000000000001',
    review_gallery_id: null,
    poster_gallery_id: null,
    created_at: '2026-03-26T15:28:32.000Z',
    updated_at: '2026-03-27T08:20:10.000Z',
}

describe('productions api', () => {
    beforeEach(() => {
        fetchMock.mockReset()
    })

    it('fetches a production by id from the correct endpoint', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: baseProduction,
                links: { self: 'http://localhost/api/v1/archive/productions/dab70000-0000-0000-0000-000000000001' },
            }),
        } as unknown as Response)

        const result = await getProductionById('dab70000-0000-0000-0000-000000000001')

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/productions/dab70000-0000-0000-0000-000000000001',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data.id).toBe('dab70000-0000-0000-0000-000000000001')
        expect(result.data.title).toEqual({ nl: 'Kapiteinsavond', en: 'Captain Night' })
    })

    it('returns raw date strings from the api', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: baseProduction,
                links: { self: 'http://localhost' },
            }),
        } as unknown as Response)

        const result = await getProductionById('dab70000-0000-0000-0000-000000000001')

        expect(result.data.created_at).toBe('2026-03-26T15:28:32.000Z')
        expect(result.data.updated_at).toBe('2026-03-27T08:20:10.000Z')
    })

    it('handles a production with nullable gallery ids', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: baseProduction,
                links: { self: 'http://localhost' },
            }),
        } as unknown as Response)

        const result = await getProductionById('dab70000-0000-0000-0000-000000000001')

        expect(result.data.media_gallery_id).toBe('e9e00000-0000-0000-0000-000000000001')
        expect(result.data.review_gallery_id).toBeNull()
        expect(result.data.poster_gallery_id).toBeNull()
    })

    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: vi.fn().mockResolvedValueOnce({ message: 'Not found' }),
        } as unknown as Response)

        await expect(getProductionById('dab70000-0000-0000-0000-000000000001')).rejects.toThrow()
    })

})