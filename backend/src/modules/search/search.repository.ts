import { Prisma, type PrismaClient } from '@prisma/client'
import type { BlogResponse } from '../blogs/blogs.schema.js'
import type { LocalizedBlogTitle } from '../blogs/blogs.schema.js'

type BlogSearchOptions = {
    search?: string
    yearFrom?: number
    yearTo?: number
}

export class SearchRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private normalizeBlogTitle(title: unknown): LocalizedBlogTitle | string | null {
        if (title == null) {
            return null
        }

        if (typeof title === 'string') {
            try {
                const parsed = JSON.parse(title) as unknown
                if (this.isLocalizedBlogTitle(parsed)) {
                    return parsed
                }
            } catch {
                return { nl: title, en: title }
            }

            return { nl: title, en: title }
        }

        if (this.isLocalizedBlogTitle(title)) {
            return title
        }

        return title as LocalizedBlogTitle | string | null
    }

    private isLocalizedBlogTitle(value: unknown): value is LocalizedBlogTitle {
        if (typeof value !== 'object' || value === null) {
            return false
        }

        const record = value as Record<string, unknown>
        return 'nl' in record || 'en' in record
    }

    private parseSearchDate(search: string): { from: Date; to: Date } | null {
        const trimmed = search.trim()
        if (!trimmed) return null

        const isoMatch = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/)
        const localMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)

        const year = isoMatch ? Number(isoMatch[1]) : localMatch ? Number(localMatch[3]) : NaN
        const month = isoMatch ? Number(isoMatch[2]) : localMatch ? Number(localMatch[2]) : NaN
        const day = isoMatch ? Number(isoMatch[3]) : localMatch ? Number(localMatch[1]) : NaN

        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null

        const from = new Date(Date.UTC(year, month - 1, day))
        if (
            from.getUTCFullYear() !== year ||
            from.getUTCMonth() !== month - 1 ||
            from.getUTCDate() !== day
        ) {
            return null
        }

        return { from, to: new Date(Date.UTC(year, month - 1, day + 1)) }
    }

    private buildBlogWhere(options: BlogSearchOptions): Prisma.blogWhereInput {
        const conditions: Prisma.blogWhereInput[] = []
        const trimmedSearch = options.search?.trim()

        if (trimmedSearch) {
            const dateRange = this.parseSearchDate(trimmedSearch)
            const searchConditions: Prisma.blogWhereInput[] = [
                { title: { path: ['nl'], string_contains: trimmedSearch, mode: 'insensitive' } },
                { title: { path: ['en'], string_contains: trimmedSearch, mode: 'insensitive' } },
                { content: { path: ['nl'], string_contains: trimmedSearch, mode: 'insensitive' } },
                { content: { path: ['en'], string_contains: trimmedSearch, mode: 'insensitive' } },
            ]

            if (dateRange) {
                searchConditions.push({ created_at: { gte: dateRange.from, lt: dateRange.to } })
            }

            conditions.push({ OR: searchConditions })
        }

        if (options.yearFrom || options.yearTo) {
            const fromYear = Math.min(options.yearFrom ?? 1970, options.yearTo ?? 9999)
            const toYear = Math.max(options.yearFrom ?? 1970, options.yearTo ?? 9999)
            conditions.push({
                created_at: {
                    gte: new Date(Date.UTC(fromYear, 0, 1)),
                    lt: new Date(Date.UTC(toYear + 1, 0, 1)),
                },
            })
        }

        return conditions.length > 0 ? { AND: conditions } : {}
    }

    async findAllBlogs(options: BlogSearchOptions): Promise<BlogResponse[]> {
        const where = this.buildBlogWhere(options)

        const blogs = await this.prisma.blog.findMany({
            where,
            include: {
                blog_production: { select: { production_id: true } },
            },
            orderBy: { created_at: 'desc' },
        })

        return blogs.map((blog) => ({
            id: blog.id,
            title: this.normalizeBlogTitle(blog.title),
            content: blog.content,
            productions: blog.blog_production.map((r) => r.production_id),
            createdAt: blog.created_at,
            updatedAt: blog.updated_at,
        }))
    }
}
