import type { FastifyPluginAsync } from 'fastify'
import { BlogsRepository } from './blogs.repository.js'
import { BlogsService } from './blogs.service.js'
import { BlogsController } from './blogs.controller.js'
import { z } from 'zod'
import { 
    blogSchema,
    blogListSchema,
    createBlogSchema,
    updateBlogSchema,
    blogParamsSchema,
    errorSchema
} from './blogs.schema.js'
import { requireAuth } from '../../hooks/require-auth.js'

const blogsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new BlogsRepository(fastify.prisma)
    const service = new BlogsService(repository)
    const controller = new BlogsController(service)

    fastify.get('/', {
        schema: {
            tags: ['blogs'],
            summary: 'Get all blogs',
            response: {
                200: blogListSchema,
            },
        },
        handler: (request, reply) => controller.getBlogs(request, reply),
    })

    fastify.get('/:id', {
        schema: {
            tags: ['blogs'],
            summary: 'Get a blog by ID',
            params: blogParamsSchema,
            response: {
                200: blogSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getBlog(request as any, reply),
    })

    fastify.post('/', {
        preHandler: [requireAuth],
        schema: {
            tags: ['blogs'],
            summary: 'Create a new blog',
            body: createBlogSchema,
            response: {
                201: blogSchema,
            },
        },
        handler: (request, reply) => controller.createBlog(request as any, reply),
    })

    fastify.put('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['blogs'],
            summary: 'Update a blog',
            params: blogParamsSchema,
            body: updateBlogSchema,
            response: {
                200: blogSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateBlog(request as any, reply),
    })

    fastify.delete('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['blogs'],
            summary: 'Delete a blog',
            params: blogParamsSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteBlog(request as any, reply),
    })
}

export default blogsRoutes
