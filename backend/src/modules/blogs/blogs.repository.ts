import type { PrismaClient } from '@prisma/client'
import type { Blog, CreateBlog, UpdateBlog } from './blogs.schema.js'
import { randomUUID } from 'crypto'

/**
 * A repository for managing blogs.
 * Note: Currently using in-memory storage since blogs are not yet in the DB.
 */
export class BlogsRepository {
    private blogs: Blog[] = []

    constructor(private prisma: PrismaClient) {}

    async findAll(): Promise<Blog[]> {
        return this.blogs
    }

    async findById(id: string): Promise<Blog | null> {
        return this.blogs.find(b => b.id === id) || null
    }

    async create(data: CreateBlog): Promise<Blog> {
        const now = new Date().toISOString()
        const newBlog: Blog = {
            id: randomUUID(),
            title: data.title,
            content: data.content,
            publishedAt: data.publishedAt || null,
            createdAt: now,
            updatedAt: now,
        }
        this.blogs.push(newBlog)
        return newBlog
    }

    async update(id: string, data: UpdateBlog): Promise<Blog | null> {
        const index = this.blogs.findIndex(b => b.id === id)
        if (index === -1) return null

        const updatedBlog = {
            ...this.blogs[index],
            ...data,
            updatedAt: new Date().toISOString(),
        }
        this.blogs[index] = updatedBlog
        return updatedBlog
    }

    async delete(id: string): Promise<boolean> {
        const index = this.blogs.findIndex(b => b.id === id)
        if (index === -1) return false

        this.blogs.splice(index, 1)
        return true
    }
}
