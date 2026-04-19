import { BlogsRepository } from './blogs.repository.js'
import type { 
    BlogPaginationQuery, 
    BlogResponse,
    CreateBlogInput,
    UpdateBlogInput
} from './blogs.schema.js'
import { PaginatedResult, calculateTotalPages } from '../../utils/pagination.js'

export class BlogsService {
    constructor(private readonly repository: BlogsRepository) {}

    async getBlogs(options: BlogPaginationQuery): Promise<PaginatedResult<BlogResponse>> {
        const { page, limit, search } = options

        const [items, total] = await Promise.all([
            this.repository.findAll({ page, limit, search }),
            this.repository.count({ search }),
        ])

        const totalPages = calculateTotalPages(total, limit)

        return {
            items,
            total,
            page,
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
}
