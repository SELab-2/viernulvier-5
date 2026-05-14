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
})
