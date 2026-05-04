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

    it('returns a production by id without derived fields', async () => {
        const mockProduction = {
            id: productionId,
            title: { nl: 'Test Productie' },
        }
        repository.findById.mockResolvedValue(mockProduction)

        const result = await service.getProduction(productionId)

        expect(result).toEqual(mockProduction)
        expect(result).not.toHaveProperty('image_url')
        expect(result).not.toHaveProperty('venue_name')
    })

    it('returns paginated productions without derived fields', async () => {
        const mockProductions = [
            { id: '1', title: { nl: 'Prod 1' } },
            { id: '2', title: { nl: 'Prod 2' } },
        ]
        repository.count.mockResolvedValue(2)
        repository.findAll.mockResolvedValue(mockProductions)

        const result = await service.getProductions({ page: 1, limit: 10 })

        expect(result.items).toEqual(mockProductions)
        expect(result.total).toBe(2)
        expect(result.items[0]).not.toHaveProperty('image_url')
    })
})
