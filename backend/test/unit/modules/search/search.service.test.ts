import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchService } from '../../../../src/modules/search/search.service.js'

function createSearchRepositoryMock() {
    return {
        searchAll: vi.fn(),
    }
}

describe('SearchService', () => {
    let searchRepository: ReturnType<typeof createSearchRepositoryMock>
    let service: SearchService

    beforeEach(() => {
        searchRepository = createSearchRepositoryMock()
        service = new SearchService(searchRepository as any)
    })

    it('forwards options to repository.searchAll', async () => {
        searchRepository.searchAll.mockResolvedValue({ items: [], total: 0 })

        const options = {
            page: 2,
            limit: 12,
            search: 'term',
            yearFrom: 2024,
            yearTo: 2026,
            genres: 'theatre',
            locations: 'online',
            sort: 'recent' as const,
            lang: 'nl',
            tab: 'all' as const,
        }

        await service.search(options)

        expect(searchRepository.searchAll).toHaveBeenCalledTimes(1)
        expect(searchRepository.searchAll).toHaveBeenCalledWith(options)
    })

    it('returns repository items and computes totalPages', async () => {
        const items = [
            {
                id: '9f6a4f37-84cf-4aa0-8cb9-5adf8af8bd8c',
                type: 'production' as const,
                title: { nl: 'Production 1' },
            },
        ]

        searchRepository.searchAll.mockResolvedValue({
            items,
            total: 25,
        })

        const result = await service.search({
            page: 1,
            limit: 12,
            sort: 'relevance',
            lang: 'nl',
            tab: 'all',
        })

        expect(result.items).toEqual(items)
        expect(result.total).toBe(25)
        expect(result.page).toBe(1)
        expect(result.limit).toBe(12)
        expect(result.totalPages).toBe(3)
    })

    it('returns totalPages 0 when repository total is 0', async () => {
        searchRepository.searchAll.mockResolvedValue({ items: [], total: 0 })

        const result = await service.search({
            page: 1,
            limit: 10,
            sort: 'recent',
            lang: 'nl',
            tab: 'all',
        })

        expect(result.total).toBe(0)
        expect(result.totalPages).toBe(0)
        expect(result.items).toEqual([])
    })
})
