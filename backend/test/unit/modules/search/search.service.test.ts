import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchService } from '../../../../src/modules/search/search.service.js'

function createSearchRepositoryMock() {
    return {
        findAllBlogs: vi.fn(),
    }
}

function createProductionsServiceMock() {
    return {
        getProductions: vi.fn(),
    }
}

function createPostersServiceMock() {
    return {
        getPosters: vi.fn(),
    }
}

describe('SearchService', () => {
    let searchRepository: ReturnType<typeof createSearchRepositoryMock>
    let productionsService: ReturnType<typeof createProductionsServiceMock>
    let postersService: ReturnType<typeof createPostersServiceMock>
    let service: SearchService

    beforeEach(() => {
        searchRepository = createSearchRepositoryMock()
        productionsService = createProductionsServiceMock()
        postersService = createPostersServiceMock()
        service = new SearchService(searchRepository as any, productionsService as any, postersService as any)
    })

    it('merges productions and posters and paginates sorted by recent first', async () => {
        productionsService.getProductions
            .mockResolvedValueOnce({
                items: [{ id: 'prod-preview' }],
                total: 2,
                page: 1,
                limit: 1,
                totalPages: 2,
            })
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 'prod-1',
                        title: { nl: 'Production 1' },
                        created_at: '2025-06-10T00:00:00.000Z',
                        teaser: null,
                        description_short: null,
                        description: null,
                        image_url: null,
                        venue_name: null,
                        venue_names: [],
                        production_genres: [],
                        performer_type: null,
                        attendance_mode: null,
                    },
                    {
                        id: 'prod-2',
                        title: { nl: 'Production 2' },
                        created_at: '2024-02-01T00:00:00.000Z',
                        teaser: null,
                        description_short: null,
                        description: null,
                        image_url: null,
                        venue_name: null,
                        venue_names: [],
                        production_genres: [],
                        performer_type: null,
                        attendance_mode: null,
                    },
                ],
                total: 2,
                page: 1,
                limit: 2,
                totalPages: 1,
            })

        postersService.getPosters.mockResolvedValue({
            items: [
                {
                    id: 'poster-1',
                    title: 'Poster 1',
                    mime_type: 'image/jpeg',
                    created_at: '2025-08-01T00:00:00.000Z',
                    production: {
                        id: 'prod-1',
                        title: { nl: 'Venue via production' },
                    },
                },
            ],
            total: 1,
            page: 1,
            limit: 100,
            totalPages: 1,
        })

        const result = await service.search({
            page: 1,
            limit: 2,
            search: 'term',
            yearFrom: 2024,
            yearTo: 2026,
            sort: 'recent',
            lang: 'nl',
        })

        expect(result.total).toBe(3)
        expect(result.totalPages).toBe(2)
        expect(result.page).toBe(1)
        expect(result.items).toHaveLength(2)
        expect(result.items.map((item) => item.id)).toEqual(['poster-1', 'prod-1'])

        expect(productionsService.getProductions).toHaveBeenNthCalledWith(1, {
            draft: false,
            search: 'term',
            genres: undefined,
            locations: undefined,
            yearFrom: 2024,
            yearTo: 2026,
            sort: 'recent',
            lang: 'nl',
            onThisDay: false,
            page: 1,
            limit: 1,
        })
        expect(postersService.getPosters).toHaveBeenNthCalledWith(1, {
            search: 'term',
            yearFrom: 2024,
            yearTo: 2026,
            page: 1,
            limit: 1,
            sort: 'recent',
            lang: 'nl',
        })

        expect(postersService.getPosters).toHaveBeenNthCalledWith(2, {
            search: 'term',
            yearFrom: 2024,
            yearTo: 2026,
            page: 1,
            limit: 1,
            sort: 'recent',
            lang: 'nl',
        })
    })

    it('skips blogs and posters when genre/location filters are active', async () => {
        productionsService.getProductions
            .mockResolvedValueOnce({ items: [{ id: 'prod-preview' }], total: 1, page: 1, limit: 1, totalPages: 1 })
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 'prod-1',
                        title: { nl: 'Production 1' },
                        created_at: '2025-06-10T00:00:00.000Z',
                        teaser: null,
                        description_short: null,
                        description: null,
                        image_url: null,
                        venue_name: null,
                        venue_names: [],
                        production_genres: ['theater'],
                        performer_type: null,
                        attendance_mode: 'offline',
                    },
                ],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            })

        const result = await service.search({
            page: 1,
            limit: 20,
            genres: 'theater',
            locations: 'theaterzaal',
            sort: 'relevance',
            lang: 'nl',
        })

        expect(result.total).toBe(1)
        expect(result.items).toHaveLength(1)
        expect(result.items[0]?.type).toBe('production')
        expect(postersService.getPosters).not.toHaveBeenCalled()
    })

    it('sorts oldest first when requested', async () => {
        productionsService.getProductions
            .mockResolvedValueOnce({ items: [{ id: 'prod-preview' }], total: 1, page: 1, limit: 1, totalPages: 1 })
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 'prod-newer',
                        title: { nl: 'Production newer' },
                        created_at: '2025-01-01T00:00:00.000Z',
                        teaser: null,
                        description_short: null,
                        description: null,
                        image_url: null,
                        venue_name: null,
                        venue_names: [],
                        production_genres: [],
                        performer_type: null,
                        attendance_mode: null,
                    },
                ],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            })

        postersService.getPosters.mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            limit: 100,
            totalPages: 0,
        })

        const result = await service.search({
            page: 1,
            limit: 10,
            sort: 'oldest',
            lang: 'nl',
        })

        expect(result.items.map((item) => item.id)).toEqual(['prod-newer'])
    })
})
