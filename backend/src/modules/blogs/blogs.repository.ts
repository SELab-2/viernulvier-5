import { Prisma, type PrismaClient } from '@prisma/client'
import type { CreateBlogInput, UpdateBlogInput, BlogResponse, BlogPaginationQuery } from './blogs.schema.js'
import { AppError } from '../../errors/app-error.js'

export class BlogsRepository {
    constructor(private readonly prisma: PrismaClient) {}

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
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search
            ? {
                title: { contains: search, mode: 'insensitive' as const },
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
                title: { contains: search, mode: 'insensitive' as const },
            }
            : undefined

        return this.prisma.blog.count({ where })
    }

    async findById(id: string): Promise<BlogResponse | null> {
        const blog = await this.prisma.blog.findUnique({
            where: { id },
            include: this.blogInclude,
        })

        return blog ? this.mapBlog(blog) : null
    }

    async create(data: CreateBlogInput): Promise<BlogResponse> {
        const productionIds = data.productionIds ?? []

        const blog = await this.prisma.blog.create({
            data: {
                title: data.title,
                content: (data.content ?? null) as Prisma.InputJsonValue,
                blog_production: {
                    create: productionIds.map((productionId) => ({
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
                            create: (data.productionIds ?? []).map((productionId) => ({
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
