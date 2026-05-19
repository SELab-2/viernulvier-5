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

describe('ProductionsService', () => {
    const productionId = 'f67bb24d-1111-4f49-9f77-d0b6c3d2bd8a'
    let repository: ReturnType<typeof createRepositoryMock>
    let service: ProductionsService

    beforeEach(() => {
        repository = createRepositoryMock()
        service = new ProductionsService(repository as any)
    })

    it('returns a production by id with derived fields', async () => {
        const mockProduction = {
            id: productionId,
            title: { nl: 'Test Productie' },
        }
        repository.findById.mockResolvedValue(mockProduction)

        const result = await service.getProduction(productionId)

        expect(result).toEqual({
            ...mockProduction,
            image_url: null,
            venue_name: null,
            venue_names: [],
            production_genres: [],
            on_this_day_event_date: null,
            poster: null,
            poster_file_url: null,
        })
    })

    it('returns paginated productions with derived fields', async () => {
        const mockProductions = [
            { id: '1', title: { nl: 'Prod 1' } },
            { id: '2', title: { nl: 'Prod 2' } },
        ]
        repository.count.mockResolvedValue(2)
        repository.findAll.mockResolvedValue(mockProductions)

        const result = await service.getProductions({ page: 1, limit: 10 })

        expect(result.items).toEqual([
            {
                ...mockProductions[0],
                image_url: null,
                venue_name: null,
                venue_names: [],
                production_genres: [],
                on_this_day_event_date: null,
                poster: null,
                poster_file_url: null,
            },
            {
                ...mockProductions[1],
                image_url: null,
                venue_name: null,
                venue_names: [],
                production_genres: [],
                on_this_day_event_date: null,
                poster: null,
                poster_file_url: null,
            },
        ])
        expect(result.total).toBe(2)
        expect(result.items[0]).toHaveProperty('image_url')
    })

    it('uses locally hosted preferred crop files for production images before remote URLs', async () => {
        const mockProduction = {
            id: productionId,
            title: { nl: 'Test Productie' },
            media_gallery: {
                items: [
                    {
                        position: 1,
                        link: 'https://remote.example/item.jpg',
                        crops: [
                            {
                                id: 'crop-remote',
                                name: 'fe3_grid',
                                url: 'https://remote.example/grid.jpg',
                                file_location: '/tmp/crops/grid.webp',
                            },
                            {
                                id: 'crop-local',
                                name: 'fe3_header',
                                url: 'https://remote.example/header.jpg',
                                file_location: '/tmp/crops/header.webp',
                            },
                        ],
                    },
                ],
            },
        }
        repository.findById.mockResolvedValue(mockProduction)

        const result = await service.getProduction(productionId)

        expect(result?.image_url).toBe('/api/v1/images/crop-local')
    })

    it('passes pastOnly=false through to the repository', async () => {
        repository.count.mockResolvedValue(0)
        repository.findAll.mockResolvedValue([])

        await service.getProductions({ page: 1, limit: 10, pastOnly: false })

        expect(repository.count).toHaveBeenCalledWith(expect.objectContaining({ pastOnly: false }))
        expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({ pastOnly: false }))
    })

    it('filters out internal fields from the response', async () => {
        const mockProductionWithGalleries = {
            id: productionId,
            title: { nl: 'Test Productie' },
            media_gallery: { id: 'gallery-1', items: [] },
            poster_gallery: { id: 'poster-gallery-1', other_files: [] },
        }
        repository.findById.mockResolvedValue(mockProductionWithGalleries)

        const result = await service.getProduction(productionId)

        expect(result).not.toHaveProperty('media_gallery')
        expect(result).not.toHaveProperty('poster_gallery')
        expect(result.id).toBe(productionId)
    })
})
