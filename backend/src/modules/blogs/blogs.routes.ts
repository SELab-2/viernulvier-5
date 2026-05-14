import type { FastifyPluginAsync } from 'fastify'
import { BlogsRepository } from './blogs.repository.js'
import { BlogsService } from './blogs.service.js'
import { BlogsController } from './blogs.controller.js'
import { z } from 'zod'
import { 
    blogPaginationQuerySchema,
    blogListSchema,
    singleBlogSchema,
    createBlogSchema, 
    updateBlogSchema, 
    blogIdSchema,
    uploadBlogImageSchema,
    uploadBlogImageResponseSchema,
    errorSchema
} from './blogs.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'

const blogsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new BlogsRepository(fastify.prisma)
    const service = new BlogsService(repository)
    const controller = new BlogsController(service)

    // GET /api/v1/archive/blogs
    fastify.get('/', {
        schema: {
            tags: ['blogs'],
            summary: 'Get all blogs',
            querystring: blogPaginationQuerySchema,
            response: {
                200: blogListSchema,
            },
        },
        handler: (request, reply) => controller.getBlogs(request as any, reply),
    })

    // GET /api/v1/archive/blogs/:id
    fastify.get('/:id', {
        schema: {
            tags: ['blogs'],
            summary: 'Get a blog by ID',
            params: blogIdSchema,
            response: {
                200: singleBlogSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getBlog(request as any, reply),
    })

    // POST /api/v1/archive/blogs
    fastify.post('/', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['blogs'],
            summary: 'Create a new blog',
            body: createBlogSchema,
            response: {
                201: singleBlogSchema,
            },
        },
        handler: (request, reply) => controller.createBlog(request as any, reply),
    })

    // PATCH /api/v1/archive/blogs/:id
    fastify.patch('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_UPDATE)],
        schema: {
            tags: ['blogs'],
            summary: 'Update a blog',
            params: blogIdSchema,
            body: updateBlogSchema,
            response: {
                200: singleBlogSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateBlog(request as any, reply),
    })

    // DELETE /api/v1/archive/blogs/:id
    fastify.delete('/:id', {
        preHandler: [requirePermission(Permission.ARCHIVE_DELETE)],
        schema: {
            tags: ['blogs'],
            summary: 'Delete a blog',
            params: blogIdSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteBlog(request as any, reply),
    })

    // POST /api/v1/archive/blogs/:id/images
    fastify.post('/:id/images', {
        preHandler: [requirePermission(Permission.ARCHIVE_CREATE)],
        schema: {
            tags: ['blogs'],
            summary: 'Upload images to a blog',
            params: blogIdSchema,
            body: uploadBlogImageSchema,
            response: {
                200: z.object({
                    data: uploadBlogImageResponseSchema,
                    links: z.object({
                        self: z.string().url(),
                    }),
                }),
                404: errorSchema,
            },
        },
        handler: (request, reply) => controller.uploadBlogImages(request as any, reply),
    })
}

export default blogsRoutes
