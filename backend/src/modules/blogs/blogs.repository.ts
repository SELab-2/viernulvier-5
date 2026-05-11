import { Prisma, type PrismaClient } from '@prisma/client'
import type {
    CreateBlogInput,
    UpdateBlogInput,
    BlogResponse,
    BlogPaginationQuery,
    LocalizedBlogTitle,
} from './blogs.schema.js'
import { AppError } from '../../errors/app-error.js'

type BlogFilterOptions = Pick<BlogPaginationQuery, 'search' | 'yearFrom' | 'yearTo' | 'productionId'>

export class BlogsRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private parseSearchDate(search: string): { from: Date; to: Date } | null {
        const trimmed = search.trim()
        if (!trimmed) {
            return null
        }

        const isoMatch = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/)
        const localMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)

        const year = isoMatch ? Number(isoMatch[1]) : localMatch ? Number(localMatch[3]) : NaN
        const month = isoMatch ? Number(isoMatch[2]) : localMatch ? Number(localMatch[2]) : NaN
        const day = isoMatch ? Number(isoMatch[3]) : localMatch ? Number(localMatch[1]) : NaN

        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
            return null
        }

        const from = new Date(Date.UTC(year, month - 1, day))
        if (
            from.getUTCFullYear() !== year ||
            from.getUTCMonth() !== month - 1 ||
            from.getUTCDate() !== day
        ) {
            return null
        }

        const to = new Date(Date.UTC(year, month - 1, day + 1))
        return { from, to }
    }

    private buildWhere(options: BlogFilterOptions): Prisma.blogWhereInput {
        const conditions: Prisma.blogWhereInput[] = []
        const trimmedSearch = options.search?.trim()

        if (trimmedSearch) {
            const dateRange = this.parseSearchDate(trimmedSearch)
            const searchConditions: Prisma.blogWhereInput[] = [
                {
                    title: {
                        path: ['nl'],
                        string_contains: trimmedSearch,
                    },
                },
                {
                    title: {
                        path: ['en'],
                        string_contains: trimmedSearch,
                    },
                },
                {
                    content: {
                        path: ['nl'],
                        string_contains: trimmedSearch,
                    },
                },
                {
                    content: {
                        path: ['en'],
                        string_contains: trimmedSearch,
                    },
                },
            ]

            if (dateRange) {
                searchConditions.push({ createdAt: { gte: dateRange.from, lt: dateRange.to } })
            }

            conditions.push({ OR: searchConditions })
        }

        if (options.yearFrom || options.yearTo) {
            const fromYear = Math.min(options.yearFrom ?? 1970, options.yearTo ?? 9999)
            const toYear = Math.max(options.yearFrom ?? 1970, options.yearTo ?? 9999)
            conditions.push({
                createdAt: {
                    gte: new Date(Date.UTC(fromYear, 0, 1)),
                    lt: new Date(Date.UTC(toYear + 1, 0, 1)),
                },
            })
        }

        if (options.productionId) {
            conditions.push({
                blog_production: {
                    some: {
                        production_id: options.productionId,
                    },
                },
            })
        }

        return conditions.length > 0 ? { AND: conditions } : {}
    }

    private normalizeBlogTitle(title: CreateBlogInput['title'] | UpdateBlogInput['title'] | unknown): LocalizedBlogTitle | string | null {
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

    private toDatabaseBlogTitle(
        title: CreateBlogInput['title'] | UpdateBlogInput['title'] | unknown,
    ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
        const normalized = this.normalizeBlogTitle(title)

        if (normalized == null) {
            return Prisma.JsonNull
        }

        if (typeof normalized === 'string') {
            return { nl: normalized, en: normalized }
        }

        return normalized as Prisma.InputJsonValue
    }

    private isLocalizedBlogTitle(value: unknown): value is LocalizedBlogTitle {
        if (typeof value !== 'object' || value === null) {
            return false
        }

        const record = value as Record<string, unknown>
        return ('nl' in record || 'en' in record)
    }

    private readonly blogInclude = {
        blog_production: {
            select: {
                production_id: true,
            },
        },
    } as const

    private mapBlog(blog: {
        id: string
        title: unknown
        content: unknown
        createdAt: Date
        updatedAt: Date
        blog_production?: Array<{ production_id: string }>
    }): BlogResponse {
        return {
            id: blog.id,
            title: this.normalizeBlogTitle(blog.title),
            content: blog.content,
            productions: blog.blog_production?.map((relation) => relation.production_id) ?? [],
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
        }
    }

    async findAll(options: BlogPaginationQuery): Promise<BlogResponse[]> {
        const { page, limit } = options
        const skip = (page - 1) * limit
        const where = this.buildWhere(options)

        const blogs = await this.prisma.blog.findMany({
            where,
            include: this.blogInclude,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        })

        return blogs.map((blog) => this.mapBlog(blog))
    }

    async count(options: BlogFilterOptions): Promise<number> {
        const where = this.buildWhere(options)
        return this.prisma.blog.count({ where })
    }

    async countInRange({ from, to }: { from: Date; to: Date }): Promise<number> {
        return this.prisma.blog.count({
            where: {
                createdAt: {
                    gte: from,
                    lt: to,
                },
            },
        })
    }

    async findById(id: string): Promise<BlogResponse | null> {
        const blog = await this.prisma.blog.findUnique({
            where: { id },
            include: this.blogInclude,
        })

        return blog ? this.mapBlog(blog) : null
    }

    async create(data: CreateBlogInput): Promise<BlogResponse> {
        const title = this.toDatabaseBlogTitle(data.title)
        const blog = await this.prisma.blog.create({
            data: {
                title,
                content: (data.content ?? null) as Prisma.InputJsonValue,
                blog_production: {
                    create: data.productionIds.map((productionId) => ({
                        production: {
                            connect: { id: productionId },
                        },
                    })),
                },
            },
            include: this.blogInclude,
        })

        return this.mapBlog(blog)
    }

    async update(id: string, data: UpdateBlogInput): Promise<BlogResponse> {
        const existing = await this.prisma.blog.findUnique({ where: { id } })
        if (!existing) throw new AppError('Blog not found')

        const title = data.title !== undefined ? this.toDatabaseBlogTitle(data.title) : undefined

        const updatedBlog = await this.prisma.blog.update({
            where: { id },
            data: {
                ...(title !== undefined
                    ? { title }
                    : {}),
                ...(data.content !== undefined ? { content: data.content as Prisma.InputJsonValue } : {}),
                ...(data.productionIds !== undefined
                    ? {
                        blog_production: {
                            deleteMany: {},
                            create: data.productionIds.map((productionId) => ({
                                production: {
                                    connect: { id: productionId },
                                },
                            })),
                        },
                    }
                    : {}),
            },
            include: this.blogInclude,
        })

        return this.mapBlog(updatedBlog)
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.blog.findUnique({ where: { id } })
        if (!existing) throw new AppError('Blog not found')

        await this.prisma.$transaction([
            this.prisma.blog_production.deleteMany({ where: { blog_id: id } }),
            this.prisma.blog.delete({ where: { id } }),
        ])

    }
}
