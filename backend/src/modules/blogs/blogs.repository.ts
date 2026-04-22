import { Prisma, type PrismaClient } from '@prisma/client'
import type { CreateBlogInput, UpdateBlogInput, BlogResponse, BlogPaginationQuery } from './blogs.schema.js'
import { AppError } from '../../errors/app-error.js'

export class BlogsRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private combineSqlConditions(conditions: Prisma.Sql[], operator: 'AND' | 'OR'): Prisma.Sql {
        if (conditions.length === 0) {
            return Prisma.empty
        }

        let combined = conditions[0]
        for (let index = 1; index < conditions.length; index += 1) {
            combined = Prisma.sql`${combined} ${Prisma.raw(operator)} ${conditions[index]}`
        }

        return combined
    }

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

    private buildSearchWhereSql(options: Pick<BlogPaginationQuery, 'search' | 'yearFrom' | 'yearTo'>): Prisma.Sql {
        const clauses: Prisma.Sql[] = []
        const trimmedSearch = options.search?.trim()

        if (trimmedSearch) {
            const likeSearch = `%${trimmedSearch}%`
            const searchConditions: Prisma.Sql[] = [
                Prisma.sql`title ILIKE ${likeSearch}`,
                Prisma.sql`CAST(content AS TEXT) ILIKE ${likeSearch}`,
            ]

            const dateRange = this.parseSearchDate(trimmedSearch)
            if (dateRange) {
                searchConditions.push(
                    Prisma.sql`("created_at" >= ${dateRange.from} AND "created_at" < ${dateRange.to})`,
                )
            }

            const combinedSearch = this.combineSqlConditions(searchConditions, 'OR')
            clauses.push(Prisma.sql`(${combinedSearch})`)
        }

        if (options.yearFrom || options.yearTo) {
            const fromYear = options.yearFrom ?? 1970
            const toYear = options.yearTo ?? 9999
            const normalizedFromYear = Math.min(fromYear, toYear)
            const normalizedToYear = Math.max(fromYear, toYear)
            const from = new Date(Date.UTC(normalizedFromYear, 0, 1))
            const to = new Date(Date.UTC(normalizedToYear + 1, 0, 1))

            clauses.push(Prisma.sql`("created_at" >= ${from} AND "created_at" < ${to})`)
        }

        if (clauses.length === 0) {
            return Prisma.empty
        }

        const combinedClauses = this.combineSqlConditions(clauses, 'AND')
        return Prisma.sql`WHERE ${combinedClauses}`
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
        title: string | null
        content: unknown
        createdAt: Date
        updatedAt: Date
        blog_production: Array<{ production_id: string }>
    }): BlogResponse {
        return {
            id: blog.id,
            title: blog.title,
            content: blog.content,
            productions: blog.blog_production.map((relation) => relation.production_id),
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
        }
    }

    async findAll(options: BlogPaginationQuery): Promise<BlogResponse[]> {
        const { page, limit } = options
        const skip = (page - 1) * limit

        const whereSql = this.buildSearchWhereSql(options)

        const blogIds = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT id
            FROM "blog"
            ${whereSql}
            ORDER BY "created_at" DESC
            OFFSET ${skip}
            LIMIT ${limit}
        `)

        if (blogIds.length === 0) {
            return []
        }

        const blogs = await this.prisma.blog.findMany({
            where: {
                id: {
                    in: blogIds.map((blog) => blog.id),
                },
            },
            include: this.blogInclude,
            orderBy: { createdAt: 'desc' },
        })

        return blogs.map((blog) => this.mapBlog(blog))
    }

    async count(options: Pick<BlogPaginationQuery, 'search' | 'yearFrom' | 'yearTo'>): Promise<number> {
        const whereSql = this.buildSearchWhereSql(options)
        const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
            SELECT COUNT(*)::bigint AS count
            FROM "blog"
            ${whereSql}
        `)

        return Number(result[0]?.count ?? 0)
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
        const blog = await this.prisma.blog.create({
            data: {
                title: data.title,
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

        const updatedBlog = await this.prisma.blog.update({
            where: { id },
            data: {
                ...(data.title !== undefined ? { title: data.title } : {}),
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
