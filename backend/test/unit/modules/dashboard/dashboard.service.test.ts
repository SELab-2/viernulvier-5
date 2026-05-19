import { describe, expect, it, vi } from 'vitest'
import { DashboardService } from '../../../../src/modules/dashboard/dashboard.service.js'

function createRepository(overrides = {}) {
    return {
        getCounts: vi.fn().mockResolvedValue({
            productions: 2,
            posters: 3,
            blogs: 1,
            mediaItems: 4,
            editors: 5,
        }),
        getLastScraped: vi.fn().mockResolvedValue(new Date('2026-05-10T00:00:00.000Z')),
        getRecentProductions: vi.fn().mockResolvedValue([
            {
                id: 'production-1',
                title: { nl: 'Productie', en: 'Production' },
                updated_at: new Date('2026-05-15T00:00:00.000Z'),
            },
        ]),
        getRecentBlogs: vi.fn().mockResolvedValue([
            {
                id: 'blog-1',
                title: { nl: 'Blog', en: 'Blog' },
                updated_at: new Date('2026-05-16T00:00:00.000Z'),
            },
        ]),
        getRecentPosters: vi.fn().mockResolvedValue([
            {
                id: 'poster-1',
                title: 'Poster',
                updated_at: new Date('2026-05-17T00:00:00.000Z'),
            },
        ]),
        getProductionCountInRange: vi.fn()
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(1),
        getBlogCountInRange: vi.fn()
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(2),
        getPosterCountInRange: vi.fn()
            .mockResolvedValueOnce(3)
            .mockResolvedValueOnce(1),
        ...overrides,
    }
}

describe('DashboardService', () => {
    it('returns recent productions blogs and posters without events', async () => {
        const repository = createRepository()
        const service = new DashboardService(repository as never)

        const summary = await service.getSummary({ page: 1, limit: 3 })

        expect(repository.getRecentProductions).toHaveBeenCalledWith(3)
        expect(repository.getRecentBlogs).toHaveBeenCalledWith(3)
        expect(repository.getRecentPosters).toHaveBeenCalledWith(3)
        expect(summary.recentItems.map((item) => item.type)).toEqual(['Poster', 'Blog', 'Productie'])
        expect(summary.recentItems[0]).not.toHaveProperty('languageStatus')
        expect(summary.totalRecentItems).toBe(6)
        expect(summary.counts).not.toHaveProperty('events')
    })

    it('computes poster deltas alongside productions and blogs', async () => {
        const repository = createRepository()
        const service = new DashboardService(repository as never)

        const summary = await service.getSummary({ page: 1, limit: 3 })

        expect(repository.getPosterCountInRange).toHaveBeenCalledTimes(2)
        expect(summary.deltas.posters).toEqual({ changePct: 200, direction: 'up' })
    })
})
