import { BlogsRepository } from './blogs.repository.js'
import type { 
    BlogPaginationQuery, 
    BlogResponse,
    CreateBlogInput,
    UpdateBlogInput,
    UploadBlogImageInput,
    UploadBlogImageResponse
} from './blogs.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'
import { BlogImagesStorage } from './blogs-images.storage.js'

export class BlogsService {
    private readonly storage: BlogImagesStorage

    constructor(private readonly repository: BlogsRepository) {
        this.storage = new BlogImagesStorage()
    }

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

    async uploadBlogImages(id: string, data: UploadBlogImageInput): Promise<UploadBlogImageResponse> {
        // Verify blog exists
        const blog = await this.repository.findById(id)
        if (!blog) {
            throw new Error('Blog not found')
        }

        // Persist image files
        const persistedFiles = await this.storage.persistBlogImageFiles(id, data.files)
        const imageUrls = persistedFiles.map((file) => file.public_url)
        const existingImages = blog.images ?? []
        const mergedImages = [...existingImages, ...imageUrls]

        // Update blog with merged images and thumbnail index
        const thumbnailIndex =
            data.thumbnail_index ??
            blog.thumbnail_index ??
            (mergedImages.length > 0 ? 0 : null)
        
        await this.repository.update(id, {
            images: mergedImages,
            thumbnail_index: thumbnailIndex,
        })

        return {
            images: mergedImages,
            thumbnail_index: thumbnailIndex,
        }
    }
}