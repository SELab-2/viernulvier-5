import { describe, expect, it, vi } from 'vitest'
import { SearchController } from '../../../../src/modules/search/search.controller.js'

describe('SearchController', () => {
    it('returns data, pagination metadata and links', async () => {
        const service = {
            search: vi.fn().mockResolvedValue({
                items: [{ id: '1', type: 'blog', title: { nl: 'Blog' } }],
                total: 11,
                page: 2,
                limit: 5,
                totalPages: 3,
            }),
        }

        const controller = new SearchController(service as any)
        const send = vi.fn((payload) => payload)
        const reply = { send }
        const request = {
            query: { page: 2, limit: 5, lang: 'nl' },
            routeOptions: { url: '/api/v1/archive/search' },
            url: '/api/v1/archive/search?page=2&limit=5&lang=nl',
        }

        const result = await controller.search(request as any, reply as any)

        expect(service.search).toHaveBeenCalledWith({ page: 2, limit: 5, lang: 'nl' })
        expect(send).toHaveBeenCalledTimes(1)
        expect(result).toEqual({
            data: [{ id: '1', type: 'blog', title: { nl: 'Blog' } }],
            meta: {
                total: 11,
                page: 2,
                limit: 5,
                totalPages: 3,
            },
            links: {
                self: '/api/v1/archive/search?page=2&limit=5&lang=nl',
                next: '/api/v1/archive/search?page=3&limit=5',
                prev: '/api/v1/archive/search?page=1&limit=5',
                first: '/api/v1/archive/search?page=1&limit=5',
                last: '/api/v1/archive/search?page=3&limit=5',
            },
        })
    })

    it('returns null next/prev when at the boundaries', async () => {
        const service = {
            search: vi.fn().mockResolvedValue({
                items: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 1,
            }),
        }

        const controller = new SearchController(service as any)
        const send = vi.fn((payload) => payload)
        const reply = { send }
        const request = {
            query: { page: 1, limit: 20, lang: 'nl' },
            routeOptions: { url: '/api/v1/archive/search' },
            url: '/api/v1/archive/search?page=1&limit=20&lang=nl',
        }

        const result = await controller.search(request as any, reply as any)

        expect(result.links.next).toBeNull()
        expect(result.links.prev).toBeNull()
        expect(result.links.first).toBe('/api/v1/archive/search?page=1&limit=20')
        expect(result.links.last).toBe('/api/v1/archive/search?page=1&limit=20')
    })
})
