import type { PrismaClient } from '@prisma/client'
import type { CreateBlogInput, UpdateBlogInput, BlogResponse, BlogPaginationQuery } from './blogs.schema.js'
import { randomUUID } from 'crypto'

// Skeleton implementation that can be used with real Prisma later
// For now, it uses an in-memory store to allow tests to pass since the DB model doesn't exist yet.
export class BlogsRepository {
    private mockBlogs: BlogResponse[] = []

    constructor(private readonly prisma: PrismaClient) {}

    async findAll(options: BlogPaginationQuery): Promise<BlogResponse[]> {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        let results = [...this.mockBlogs]

        if (search) {
            const searchLower = search.toLowerCase()
            results = results.filter(b => 
                b.title.toLowerCase().includes(searchLower) || 
                b.content.toLowerCase().includes(searchLower)
            )
        }

        // Simple mock pagination
        return results.slice(skip, skip + limit)
    }

    async count(options: { search?: string }): Promise<number> {
        const { search } = options
        let results = [...this.mockBlogs]

        if (search) {
            const searchLower = search.toLowerCase()
            results = results.filter(b =>
                b.title.toLowerCase().includes(searchLower) ||
                b.content.toLowerCase().includes(searchLower)
            )
        }

        return results.length
    }

    async countInRange({ from, to }: { from: Date; to: Date }): Promise<number> {
        return this.mockBlogs.filter(
            (b) => b.createdAt !== undefined && b.createdAt >= from && b.createdAt < to,
        ).length
    }

    async findById(id: string): Promise<BlogResponse | null> {
        return this.mockBlogs.find(b => b.id === id) || null
    }

    async create(data: CreateBlogInput): Promise<BlogResponse> {
        const newBlog: BlogResponse = {
            id: randomUUID(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        this.mockBlogs.push(newBlog)
        return newBlog
    }

    async update(id: string, data: UpdateBlogInput): Promise<BlogResponse> {
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
        const index = this.mockBlogs.findIndex(b => b.id === id)
        if (index === -1) throw new Error('Blog not found')
        this.mockBlogs.splice(index, 1)
    }
}
