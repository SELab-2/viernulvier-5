import { AppError } from '../../errors/app-error.js'
import type { BlogsRepository } from './blogs.repository.js'
import type { CreateBlogInput, UpdateBlogInput, Blog } from './blogs.schema.js'

export class BlogsService {
    constructor(private readonly blogsRepository: BlogsRepository) {}

    async getAllBlogs(): Promise<Blog[]> {
        return this.blogsRepository.findAll()
    }

    async getBlogById(id: string): Promise<Blog> {
        const blog = await this.blogsRepository.findById(id)
        if (!blog) {
            throw new AppError('Blog not found', 404)
        }
        return blog
    }

    async createBlog(data: CreateBlogInput): Promise<Blog> {
        return this.blogsRepository.create(data)
    }

    async updateBlog(id: string, data: UpdateBlogInput): Promise<Blog> {
        // Ensure the blog exists first
        await this.getBlogById(id)
        return this.blogsRepository.update(id, data)
    }

    async deleteBlog(id: string): Promise<void> {
        // Ensure the blog exists first
        await this.getBlogById(id)
        await this.blogsRepository.delete(id)
    }
}
