import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductionsService } from '../../../src/modules/productions/productions.service.js'

function createRepositoryMock() {
    return {
        findById: vi.fn(),
        findAll: vi.fn(),
        count: vi.fn(),
        findSearchIds: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    }
}

describe('ProductionsService image selection', () => {
    const productionId = 'f67bb24d-1111-4f49-9f77-d0b6c3d2bd8a'
    let repository: ReturnType<typeof createRepositoryMock>
    let service: ProductionsService

    beforeEach(() => {
        repository = createRepositoryMock()
        service = new ProductionsService(repository as any)
    })

    it('prefers position 0 item and FE3_header crop', async () => {
        repository.findById.mockResolvedValue({
            id: productionId,
            events: [],
            genre_production: [],
            poster_gallery: {
                items: [
                    {
                        position: 2,
                        crops: [{ name: 'FE3_header', url: 'https://cdn.example.com/pos2-header.jpg' }],
                    },
                    {
                        position: 0,
                        crops: [
                            { name: 'thumbnail', url: 'https://cdn.example.com/pos0-thumb.jpg' },
                            { name: 'FE3_header', url: 'https://cdn.example.com/pos0-header.jpg' },
                        ],
                    },
                ],
            },
            media_gallery: { items: [] },
        })

        const result = await service.getProduction(productionId)

        expect(result?.image_url).toBe('https://cdn.example.com/pos0-header.jpg')
    })

    it('sorts by ascending position when no position 0 and falls back to FE3_grid', async () => {
        repository.findById.mockResolvedValue({
            id: productionId,
            events: [],
            genre_production: [],
            poster_gallery: {
                items: [
                    {
                        position: 4,
                        crops: [{ name: 'FE3_header', url: 'https://cdn.example.com/pos4-header.jpg' }],
                    },
                ],
            },
            media_gallery: {
                items: [
                    {
                        position: 1,
                        crops: [{ name: 'FE3_grid', url: 'https://cdn.example.com/pos1-grid.jpg' }],
                    },
                ],
            },
        })

        const result = await service.getProduction(productionId)

        expect(result?.image_url).toBe('https://cdn.example.com/pos1-grid.jpg')
    })
})
