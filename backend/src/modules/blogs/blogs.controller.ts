import type { FastifyReply, FastifyRequest } from 'fastify'
import type { BlogsService } from './blogs.service.js'
import type { CreateBlogInput, UpdateBlogInput } from './blogs.schema.js'

export class BlogsController {
    constructor(private readonly blogsService: BlogsService) {}

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const blogs = await this.blogsService.getAllBlogs()
        return reply.status(200).send(blogs)
    }

    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const blog = await this.blogsService.getBlogById(request.params.id)
        return reply.status(200).send(blog)
    }

    async create(request: FastifyRequest<{ Body: CreateBlogInput }>, reply: FastifyReply) {
        const blog = await this.blogsService.createBlog(request.body)
        return reply.status(201).send(blog)
    }

    async update(request: FastifyRequest<{ Params: { id: string }, Body: UpdateBlogInput }>, reply: FastifyReply) {
        const blog = await this.blogsService.updateBlog(request.params.id, request.body)
        return reply.status(200).send(blog)
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        await this.blogsService.deleteBlog(request.params.id)
        return reply.status(204).send()
    }
}
