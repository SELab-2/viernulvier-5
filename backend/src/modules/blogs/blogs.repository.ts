import type { PrismaClient } from '@prisma/client'
import type { CreateBlogInput, UpdateBlogInput, Blog } from './blogs.schema.js'
import { randomUUID } from 'crypto'

// Skeleton implementation that can be used with real Prisma later
// For now, it uses an in-memory store to allow tests to pass since the DB model doesn't exist yet.
export class BlogsRepository {
    private mockBlogs: Blog[] = []

    constructor(private readonly prisma: PrismaClient) {}

    async findAll(): Promise<Blog[]> {
        // Implementation for when DB is ready:
        // return this.prisma.blog.findMany({ orderBy: { createdAt: 'desc' } })
        return this.mockBlogs
    }

    async findById(id: string): Promise<Blog | null> {
        // Implementation for when DB is ready:
        // return this.prisma.blog.findUnique({ where: { id } })
        return this.mockBlogs.find(b => b.id === id) || null
    }

    async create(data: CreateBlogInput): Promise<Blog> {
        // Implementation for when DB is ready:
        // return this.prisma.blog.create({ data })
        const newBlog: Blog = {
            id: randomUUID(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        this.mockBlogs.push(newBlog)
        return newBlog
    }

    async update(id: string, data: UpdateBlogInput): Promise<Blog> {
        // Implementation for when DB is ready:
        // return this.prisma.blog.update({ where: { id }, data })
        const index = this.mockBlogs.findIndex(b => b.id === id)
        if (index === -1) throw new Error('Blog not found')
        
        const updatedBlog = {
            ...this.mockBlogs[index],
            ...data,
            updatedAt: new Date()
        }
        this.mockBlogs[index] = updatedBlog
        return updatedBlog
    }

    async delete(id: string): Promise<void> {
        // Implementation for when DB is ready:
        // await this.prisma.blog.delete({ where: { id } })
        const index = this.mockBlogs.findIndex(b => b.id === id)
        if (index !== -1) {
            this.mockBlogs.splice(index, 1)
        }
    }
}
