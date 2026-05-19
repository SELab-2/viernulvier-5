import type { PrismaClient } from '@prisma/client'
import { Role } from '../../domain/role.js'
import type { BlogsRepository } from '../blogs/blogs.repository.js'
import type { PostersRepository } from '../posters/posters.repository.js'

export type RawProduction = {
    id: string
    title: unknown
    updated_at: Date
}

export type RawBlog = {
    id: string
    title: unknown
    updated_at: Date
}

export type RawPoster = {
    id: string
    title: string
    updated_at: Date
}

export type DashboardCounts = {
    productions: number
    posters: number
    blogs: number
    mediaItems: number
    editors: number
}

export class DashboardRepository {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly blogsRepository: BlogsRepository,
        private readonly postersRepository: PostersRepository,
    ) {}

    async getCounts(): Promise<DashboardCounts> {
        const [productions, posters, blogs, mediaItems, editors] = await Promise.all([
            this.prisma.production.count(),
            this.postersRepository.count({}),
            this.blogsRepository.count({}),
            this.prisma.item.count(),
            this.prisma.adminUser.count({ where: { role: Role.EDITOR } }),
        ])

        return { productions, posters, blogs, mediaItems, editors }
    }

    async getLastScraped(): Promise<Date | null> {
        const row = await this.prisma.last_scraped.findFirst({ orderBy: { time: 'desc' } })
        return row?.time ?? null
    }

    async getRecentProductions(limit: number): Promise<RawProduction[]> {
        return this.prisma.production.findMany({
            take: limit,
            orderBy: { updated_at: 'desc' },
            select: {
                id: true,
                title: true,
                updated_at: true,
            },
        })
    }

    async getRecentBlogs(limit: number): Promise<RawBlog[]> {
        return this.prisma.blog.findMany({
            take: limit,
            orderBy: { updated_at: 'desc' },
            select: {
                id: true,
                title: true,
                updated_at: true,
            },
        })
    }

    async getRecentPosters(limit: number): Promise<RawPoster[]> {
        const posters = await this.postersRepository.findRecent(limit)
        return posters.map((poster) => ({
            id: poster.id,
            title: poster.title,
            updated_at: poster.updated_at,
        }))
    }

    async getProductionCountInRange(from: Date, to: Date): Promise<number> {
        return this.prisma.production.count({
            where: { created_at: { gte: from, lt: to } },
        })
    }

    async getBlogCountInRange(from: Date, to: Date): Promise<number> {
        return this.blogsRepository.countInRange({ from, to })
    }

    async getPosterCountInRange(from: Date, to: Date): Promise<number> {
        return this.postersRepository.countInRange({ from, to })
    }
}
