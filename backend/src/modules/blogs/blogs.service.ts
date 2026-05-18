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
import {AppError} from "../../errors/app-error.js";
import { BlogImagesStorage } from './blogs-images.storage.js'

export class BlogsService {
    private readonly storage: BlogImagesStorage

    constructor(private readonly repository: BlogsRepository) {
        this.storage = new BlogImagesStorage()
    }

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

    private normalizeThumbnailIndex(thumbnailIndex: number | null | undefined, imagesLength: number): number | null {
        if (thumbnailIndex === null || thumbnailIndex === undefined) {
            return null
        }

        return thumbnailIndex < imagesLength ? thumbnailIndex : null
    }

    private assertThumbnailIndexWithinBounds(thumbnailIndex: number | null | undefined, imagesLength: number) {
        if (thumbnailIndex === null || thumbnailIndex === undefined) {
            return
        }

        if (thumbnailIndex >= imagesLength) {
            throw new AppError('thumbnail_index out of bounds for images array', 400)
        }
    }

    async createBlog(data: CreateBlogInput): Promise<BlogResponse> {
        this.assertThumbnailIndexWithinBounds(data.thumbnail_index, (data.images ?? []).length)
        return this.repository.create(data)
    }

    async updateBlog(id: string, data: UpdateBlogInput): Promise<BlogResponse> {
        if (data.thumbnail_index !== undefined || data.images !== undefined) {
            const blog = await this.repository.findById(id)
            if (!blog) {
                throw new Error('Blog not found')
            }

            const nextImages = data.images ?? (blog.images ?? [])
            const nextThumbnailIndex =
                data.thumbnail_index !== undefined
                    ? data.thumbnail_index
                    : blog.thumbnail_index

            this.assertThumbnailIndexWithinBounds(nextThumbnailIndex, nextImages.length)
        }

        return this.repository.update(id, data)
    }

    async deleteBlog(id: string): Promise<void> {
        const blog = await this.repository.findById(id)
        if (!blog) {
            throw new Error('Blog not found')
        }

        if ((blog.images ?? []).length > 0) {
            await this.storage.deleteBlogImages(blog.images ?? [])
        }

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

    async deleteBlogImage(id: string, index: number): Promise<UploadBlogImageResponse> {
        const blog = await this.repository.findById(id)
        if (!blog) {
            throw new Error('Blog not found')
        }

        const images = blog.images ?? []
        if (index < 0 || index >= images.length) {
            throw new Error('Image not found')
        }

        const imageToDelete = images[index]
        await this.storage.deleteBlogImages([imageToDelete])

        const remainingImages = images.filter((_, currentIndex) => currentIndex !== index)
        const currentThumbnailIndex = this.normalizeThumbnailIndex(blog.thumbnail_index ?? null, images.length)
        const thumbnailIndex =
            currentThumbnailIndex === null
                ? null
                : currentThumbnailIndex === index
                    ? null
                    : currentThumbnailIndex > index
                        ? currentThumbnailIndex - 1
                        : currentThumbnailIndex

        await this.repository.update(id, {
            images: remainingImages,
            thumbnail_index: thumbnailIndex,
        })

        return {
            images: remainingImages,
            thumbnail_index: thumbnailIndex,
        }
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

        this.assertThumbnailIndexWithinBounds(thumbnailIndex, mergedImages.length)

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