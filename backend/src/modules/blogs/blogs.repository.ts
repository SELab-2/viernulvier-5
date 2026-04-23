import { Prisma, type PrismaClient } from '@prisma/client'
import type {
    CreateBlogInput,
    UpdateBlogInput,
    BlogResponse,
    BlogPaginationQuery,
    LocalizedBlogTitle,
} from './blogs.schema.js'
import { AppError } from '../../errors/app-error.js'

export class BlogsRepository {
    constructor(private readonly prisma: PrismaClient) {}

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
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search
            ? {
                OR: [
                    {
                        title: {
                            path: ['nl'],
                            string_contains: search,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        title: {
                            path: ['en'],
                            string_contains: search,
                            mode: 'insensitive' as const,
                        },
                    },
                ],
            }
            : undefined

        const blogs = await this.prisma.blog.findMany({
            where,
            include: this.blogInclude,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        })

        return blogs.map((blog) => this.mapBlog(blog))
    }
    async count(options: { search?: string }): Promise<number> {
        const { search } = options

        const where = search
            ? {
                OR: [
                    {
                        title: {
                            path: ['nl'],
                            string_contains: search,
                            mode: 'insensitive' as const,
                        },
                    },
                    {
                        title: {
                            path: ['en'],
                            string_contains: search,
                            mode: 'insensitive' as const,
                        },
                    },
                ],
            }
            : undefined

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
        const title = this.normalizeBlogTitle(data.title)
        const blog = await this.prisma.blog.create({
            data: {
                title: title === null ? Prisma.JsonNull : (title as Prisma.InputJsonValue),
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

        const title = data.title !== undefined ? this.normalizeBlogTitle(data.title) : undefined

        const updatedBlog = await this.prisma.blog.update({
            where: { id },
            data: {
                ...(title !== undefined
                    ? { title: title === null ? Prisma.JsonNull : (title as Prisma.InputJsonValue) }
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
