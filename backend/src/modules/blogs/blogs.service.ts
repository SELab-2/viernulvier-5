import { BlogsRepository } from './blogs.repository.js'
import type { CreateBlog, UpdateBlog } from './blogs.schema.js'

export class BlogsService {
    constructor(private repository: BlogsRepository) {}

    async getBlogs() {
        return this.repository.findAll()
    }

    async getBlog(id: string) {
        return this.repository.findById(id)
    }

    async createBlog(data: CreateBlog) {
        return this.repository.create(data)
    }

    async updateBlog(id: string, data: UpdateBlog) {
        return this.repository.update(id, data)
    }

    async deleteBlog(id: string) {
        return this.repository.delete(id)
    }
}
