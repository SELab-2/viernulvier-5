import { BlogsRepository } from './blogs.repository.js'
import type { 
    BlogPaginationQuery, 
    BlogResponse,
    CreateBlogInput,
    UpdateBlogInput
} from './blogs.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class BlogsService {
    constructor(private readonly repository: BlogsRepository) {}

    async getBlogs(options: BlogPaginationQuery): Promise<PaginatedResult<BlogResponse>> {
        const { page, limit, search, yearFrom, yearTo, productionId } = options

        const total = await this.repository.count({ search, yearFrom, yearTo, productionId })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAll({ 
            page: sanitizedPage, 
            limit, 
            search,
            yearFrom,
            yearTo,
            productionId,
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
}
