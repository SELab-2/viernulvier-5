import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchService } from '../../../../src/modules/search/search.service.js'

function createSearchRepositoryMock() {
    return {
        findAllBlogs: vi.fn(),
        searchAll: vi.fn(),
        stripHtml: vi.fn((html) => html.replace(/<[^>]*>?/gm, '')),
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

    it('delegates to searchRepository.searchAll for "all" tab', async () => {
        const mockResult = {
            items: [
                { id: '1', type: 'production' as const, title: 'Prod 1' },
                { id: '2', type: 'blog' as const, title: 'Blog 1' },
            ],
            total: 2,
        }
        searchRepository.searchAll.mockResolvedValue(mockResult)

        const result = await service.search({
            page: 1,
            limit: 10,
            tab: 'all',
            search: 'term',
            lang: 'nl',
            genres: 'theater',
            locations: 'hall-1'
        })

        expect(searchRepository.searchAll).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
            tab: 'all',
            search: 'term',
            lang: 'nl',
            genres: 'theater',
            locations: 'hall-1'
        })
        expect(result.items).toEqual(mockResult.items)
        expect(result.total).toBe(2)
    })

    it('handles "blogs" tab with manual mapping and pagination', async () => {
        searchRepository.findAllBlogs.mockResolvedValue([
            {
                id: 'blog-1',
                title: { nl: 'Blog 1' },
                content: { nl: '<p>Content</p>' },
                productions: [],
                created_at: new Date('2025-01-01T10:00:00Z'),
            },
        ])

        const result = await service.search({
            page: 1,
            limit: 10,
            tab: 'blogs',
            lang: 'nl',
        })

        expect(searchRepository.findAllBlogs).toHaveBeenCalled()
        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({
            id: 'blog-1',
            type: 'blog',
            genre_label: 'Blog',
            excerpt: 'Content',
        })
    })

    it('handles "posters" tab by calling postersService', async () => {
        postersService.getPosters.mockResolvedValue({
            items: [
                {
                    id: 'poster-1',
                    title: 'Poster 1',
                    created_at: new Date('2025-01-01T10:00:00Z'),
                    productions: [],
                },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
        })

        const result = await service.search({
            page: 1,
            limit: 10,
            tab: 'posters',
            lang: 'nl',
        })

        expect(postersService.getPosters).toHaveBeenCalled()
        expect(result.items).toHaveLength(1)
        expect(result.items[0]).toMatchObject({
            id: 'poster-1',
            type: 'poster',
            genre_label: 'Poster',
        })
    })

    it('passes sort parameter to searchAll', async () => {
        searchRepository.searchAll.mockResolvedValue({ items: [], total: 0 })

        await service.search({
            page: 1,
            limit: 10,
            tab: 'all',
            sort: 'oldest'
        })

        expect(searchRepository.searchAll).toHaveBeenCalledWith(expect.objectContaining({
            sort: 'oldest'
        }))
    })
})
