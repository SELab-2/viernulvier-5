import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getGalleryItems, getItemCrops, getPreferredHeroCropUrl, getPreferredMediaCropUrl, type Crop } from '../../api/media'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function makeCrop(name: string): Crop {
    return {
        id: `00000000-0000-0000-0000-00000000000${name.length}`,
        apiId: null,
        name,
        url: `https://example.com/${name}.jpg`,
        item_id: '9e110000-0000-0000-0000-000000000001',
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-01'),
    }
}

describe('getGalleryItems', () => {
    beforeEach(() => { fetchMock.mockReset() })

    it('fetches gallery items for a given gallery id', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: [{
                    id: '9e110000-0000-0000-0000-000000000001',
                    apiId: null,
                    type: 'foto',
                    original_filename: 'photo.jpg',
                    position: 0,
                    width: 1920,
                    height: 1080,
                    format: 'image/jpeg',
                    gallery_id: 'e9e00000-0000-0000-0000-000000000001',
                    title: null,
                    description: null,
                    credits: null,
                    link: null,
                    created_at: '2026-01-01T00:00:00.000Z',
                    updated_at: '2026-01-01T00:00:00.000Z',
                }],
            }),
        } as unknown as Response)

        const result = await getGalleryItems('e9e00000-0000-0000-0000-000000000001')

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/media/items?galleryId=e9e00000-0000-0000-0000-000000000001',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data).toHaveLength(1)
        expect(result.data[0].type).toBe('foto')
    })

    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: vi.fn().mockResolvedValueOnce({ message: 'Not found' }),
        } as unknown as Response)

        await expect(getGalleryItems('e9e00000-0000-0000-0000-000000000001')).rejects.toThrow()
    })
})

describe('getItemCrops', () => {
    beforeEach(() => { fetchMock.mockReset() })

    it('fetches crops for a given item id', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValueOnce({
                data: [{
                    id: '8f360000-0000-0000-0000-000000000001',
                    apiId: null,
                    name: 'banner',
                    url: 'https://example.com/banner.jpg',
                    item_id: '9e110000-0000-0000-0000-000000000001',
                    created_at: '2026-01-01T00:00:00.000Z',
                    updated_at: '2026-01-01T00:00:00.000Z',
                }],
            }),
        } as unknown as Response)

        const result = await getItemCrops('9e110000-0000-0000-0000-000000000001')

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/v1/archive/media/items/crops?itemId=9e110000-0000-0000-0000-000000000001',
            expect.objectContaining({ credentials: 'include' }),
        )
        expect(result.data[0].name).toBe('banner')
        expect(result.data[0].url).toBe('https://example.com/banner.jpg')
    })

    it('throws when the server returns an error status', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: vi.fn().mockResolvedValueOnce({ message: 'Not found' }),
        } as unknown as Response)

        await expect(getItemCrops('9e110000-0000-0000-0000-000000000001')).rejects.toThrow()
    })
})

describe('getPreferredHeroCropUrl', () => {
    it('returns null for an empty crop list', () => {
        expect(getPreferredHeroCropUrl([])).toBeNull()
    })

    it('returns the FE3_header url when present', () => {
        const crops = [makeCrop('FE3_boxed'), makeCrop('FE3_header')]
        expect(getPreferredHeroCropUrl(crops)).toBe(`/api/v1/images/crops/FE3_header.jpg`)
    })

    it('falls back to FE3_boxed when FE3_header is missing', () => {
        const crops = [makeCrop('FE3_boxed'), makeCrop('banner')]
        expect(getPreferredHeroCropUrl(crops)).toBe('/api/v1/images/crops/FE3_boxed.jpg')
    })

    it('returns null when neither FE3_header nor FE3_boxed are present', () => {
        const crops = [makeCrop('banner'), makeCrop('cms')]
        expect(getPreferredHeroCropUrl(crops)).toBeNull()
    })

    it('respects priority order regardless of array order', () => {
        const crops = [makeCrop('FE3_boxed'), makeCrop('banner'), makeCrop('FE3_header')]
        expect(getPreferredHeroCropUrl(crops)).toBe('/api/v1/images/crops/FE3_header.jpg')
    })
})

describe('getPreferredMediaCropUrl', () => {
    it('returns null for an empty crop list', () => {
        expect(getPreferredMediaCropUrl([])).toBeNull()
    })

    it('returns the FE3_boxed url when present', () => {
        const crops = [makeCrop('FE3_header'), makeCrop('FE3_boxed')]
        expect(getPreferredMediaCropUrl(crops)).toBe('/api/v1/images/crops/FE3_boxed.jpg')
    })

    it('falls back to FE3_header when FE3_boxed is missing', () => {
        const crops = [makeCrop('FE3_header'), makeCrop('banner')]
        expect(getPreferredMediaCropUrl(crops)).toBe('/api/v1/images/crops/FE3_header.jpg')
    })

    it('returns null when neither FE3_boxed nor FE3_header are present', () => {
        const crops = [makeCrop('banner'), makeCrop('cms')]
        expect(getPreferredMediaCropUrl(crops)).toBeNull()
    })

    it('respects priority order regardless of array order', () => {
        const crops = [makeCrop('FE3_header'), makeCrop('banner'), makeCrop('FE3_boxed')]
        expect(getPreferredMediaCropUrl(crops)).toBe('/api/v1/images/crops/FE3_boxed.jpg')
    })
})