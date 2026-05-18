import { BlogsRepository } from './blogs.repository.js'
import type { 
    BlogPaginationQuery, 
    BlogResponse,
    CreateBlogInput,
    UpdateBlogInput
} from './blogs.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'
import {AppError} from "../../errors/app-error.js";

export class BlogsService {
    constructor(private readonly repository: BlogsRepository) {}

    async getBlogs(options: BlogPaginationQuery): Promise<PaginatedResult<BlogResponse>> {
        const { page, limit, search, yearFrom, yearTo, productionId, draft, editorId} = options

        const total = await this.repository.count({ search, yearFrom, yearTo, productionId, draft, editorId})
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAll({ 
            page: sanitizedPage, 
            limit, 
            search,
            yearFrom,
            yearTo,
            productionId,
            draft,
            editorId,
        })

        return {
            items,
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getBlog(id: string): Promise<BlogResponse | null> {
        return this.repository.findById(id)
    }

    async createBlog(data: CreateBlogInput): Promise<BlogResponse> {
        return this.repository.create(data)
    }

    async updateBlog(id: string, data: UpdateBlogInput): Promise<BlogResponse> {
        return this.repository.update(id, data)
    }

    async deleteBlog(id: string): Promise<void> {
        await this.repository.delete(id)
    }

    async addEditor(blogId: string, editorId: string) {
        const blog = await this.repository.findById(blogId)
        if (!blog) throw new AppError('blog not found', 404)
        return this.repository.addEditor(blogId, editorId)
    }

    async removeEditor(blogId: string, editorId: string) {
        const blog = await this.repository.findById(blogId)
        if (!blog) throw new AppError('blog not found', 404)
        return this.repository.removeEditor(blogId, editorId)
    }
}
