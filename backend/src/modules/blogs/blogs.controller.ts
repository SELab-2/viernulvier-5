import type { FastifyReply, FastifyRequest } from 'fastify'
import type { BlogsService } from './blogs.service.js'
import type { 
    BlogPaginationQuery, 
    BlogResponse,
    CreateBlogInput, 
    UpdateBlogInput 
} from './blogs.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class BlogsController {
    constructor(private readonly service: BlogsService) {}

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1`
    }

    private mapBlogLinks(blog: any, baseUrl: string): BlogResponse {
        return {
            ...blog,
            links: {
                self: `${baseUrl}/archive/blogs/${blog.id}`,
                editors: `${baseUrl}/cms-users?blogId=${blog.id}`,
            }
        }
    }

    async getBlogs(request: FastifyRequest<{ Querystring: BlogPaginationQuery }>, reply: FastifyReply) {
        const blogs = await this.service.getBlogs(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = baseUrl

        const dataWithLinks = blogs.items.map(b => this.mapBlogLinks(b, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: blogs.total,
                page: blogs.page,
                limit: blogs.limit,
                totalPages: blogs.totalPages,
            },
            links: buildPaginationLinks(currentUrl, blogs.page, blogs.limit, blogs.totalPages)
        })
    }

    async getBlog(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const blog = await this.service.getBlog(id)

        if (!blog) {
            return reply.status(404).send({ message: 'Blog not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapBlogLinks(blog, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}archive/blogs/${id}`
            }
        })
    }

    async createBlog(request: FastifyRequest<{ Body: CreateBlogInput }>, reply: FastifyReply) {
        const blog = await this.service.createBlog(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/archive/blogs${blog.id}`
        
        const dataWithLinks = this.mapBlogLinks(blog, baseUrl)

        return reply
            .status(201)
            .header('Location', selfUrl)
            .send({
                data: dataWithLinks,
                links: {
                    self: selfUrl
                }
            })
    }

    async updateBlog(request: FastifyRequest<{ Params: { id: string }, Body: UpdateBlogInput }>, reply: FastifyReply) {
        const { id } = request.params
        try {
            const blog = await this.service.updateBlog(id, request.body)
            const baseUrl = this.getBaseUrl(request)
            const dataWithLinks = this.mapBlogLinks(blog, baseUrl)
            
            return reply.status(200).send({
                data: dataWithLinks,
                links: {
                    self: `${baseUrl}/archive/blogs/${id}`
                }
            })
        } catch (error: any) {
            if (error.message === 'Blog not found') {
                return reply.status(404).send({ message: 'Blog not found' })
            }
            throw error
        }
    }

    async deleteBlog(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        try {
            await this.service.deleteBlog(id)
            return reply.status(204).send()
        } catch (error: any) {
            if (error.message === 'Blog not found') {
                return reply.status(404).send({ message: 'Blog not found' })
            }
            throw error
        }
    }

    async addEditor(request: FastifyRequest<{ Params: { id: string }, Body: { editorId: string } }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.addEditor(id, request.body.editorId)
        return reply.status(204).send()
    }

    async removeEditor(request: FastifyRequest<{ Params: { id: string, editorId: string } }>, reply: FastifyReply) {
        const { id, editorId } = request.params
        await this.service.removeEditor(id, editorId)
        return reply.status(204).send()
    }
}
