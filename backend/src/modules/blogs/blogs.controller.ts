import type { FastifyReply, FastifyRequest } from 'fastify'
import { BlogsService } from './blogs.service.js'
import type { CreateBlog, UpdateBlog } from './blogs.schema.js'

export class BlogsController {
    constructor(private service: BlogsService) {}

    async getBlogs(_request: FastifyRequest, reply: FastifyReply) {
        const blogs = await this.service.getBlogs()
        return reply.send(blogs)
    }

    async getBlog(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const blog = await this.service.getBlog(id)

        if (!blog) {
            return reply.status(404).send({ message: 'Blog not found', statusCode: 404 })
        }

        return reply.send(blog)
    }

    async createBlog(request: FastifyRequest<{ Body: CreateBlog }>, reply: FastifyReply) {
        const blog = await this.service.createBlog(request.body)
        return reply.status(201).send(blog)
    }

    async updateBlog(request: FastifyRequest<{ Params: { id: string }, Body: UpdateBlog }>, reply: FastifyReply) {
        const { id } = request.params
        const blog = await this.service.updateBlog(id, request.body)

        if (!blog) {
            return reply.status(404).send({ message: 'Blog not found', statusCode: 404 })
        }

        return reply.send(blog)
    }

    async deleteBlog(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const deleted = await this.service.deleteBlog(id)

        if (!deleted) {
            return reply.status(404).send({ message: 'Blog not found', statusCode: 404 })
        }

        return reply.status(204).send()
    }
}
