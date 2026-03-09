import type { FastifyPluginAsync } from 'fastify'
import { BlogsRepository } from './blogs.repository.js'
import { BlogsService } from './blogs.service.js'
import { BlogsController } from './blogs.controller.js'
import { z } from 'zod'
import { 
    blogSchema, 
    createBlogSchema, 
    updateBlogSchema, 
    blogIdSchema 
} from './blogs.schema.js'
import { requireAuth } from '../../hooks/require-auth.js'

const blogsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new BlogsRepository(fastify.prisma)
    const service = new BlogsService(repository)
    const controller = new BlogsController(service)

    // GET /api/archive/blogs
    fastify.get('/', {
        schema: {
            tags: ['blogs'],
            summary: 'Get all blogs',
            response: {
                200: z.array(blogSchema),
            },
        },
        handler: (request, reply) => controller.getAll(request, reply),
    })

    // GET /api/archive/blogs/:id
    fastify.get('/:id', {
        schema: {
            tags: ['blogs'],
            summary: 'Get a blog by ID',
            params: blogIdSchema,
            response: {
                200: blogSchema,
                404: z.object({ message: z.string() })
            },
        },
        handler: (request, reply) => controller.getById(request as any, reply),
    })

    // POST /api/archive/blogs
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
        handler: (request, reply) => controller.create(request as any, reply),
    })

    // PUT /api/archive/blogs/:id
    fastify.put('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['blogs'],
            summary: 'Update a blog',
            params: blogIdSchema,
            body: updateBlogSchema,
            response: {
                200: blogSchema,
                404: z.object({ message: z.string() })
            },
        },
        handler: (request, reply) => controller.update(request as any, reply),
    })

    // DELETE /api/archive/blogs/:id
    fastify.delete('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['blogs'],
            summary: 'Delete a blog',
            params: blogIdSchema,
            response: {
                204: z.null(),
                404: z.object({ message: z.string() })
            },
        },
        handler: (request, reply) => controller.delete(request as any, reply),
    })
}

export default blogsRoutes
