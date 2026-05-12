import type { FastifyPluginAsync } from 'fastify'
import { CmsUsersRepository } from './cms-users.repository.js'
import { CmsUsersService } from './cms-users.service.js'
import { CmsUsersController } from './cms-users.controller.js'
import {
    cmsUserPaginationQuerySchema,
    cmsUserListSchema,
    singleCmsUserSchema,
    createEditorSchema,
    updateEditorSchema,
    cmsUserIdSchema,
    errorSchema
} from './cms-users.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'
import { z } from 'zod'

const cmsUsersRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new CmsUsersRepository(fastify.prisma)
    const service = new CmsUsersService(repository)
    const controller = new CmsUsersController(service)

    fastify.get('/', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Get all CMS users',
            querystring: cmsUserPaginationQuerySchema,
            response: {
                200: cmsUserListSchema,
            },
        },
        handler: (request, reply) => controller.getCmsUsers(request as any, reply),
    })

    fastify.get('/editors', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Get all editors',
            querystring: cmsUserPaginationQuerySchema,
            response: {
                200: cmsUserListSchema,
            },
        },
        handler: (request, reply) => controller.getEditors(request as any, reply),
    })

    fastify.get('/editors/:id', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Get an editor by ID',
            params: cmsUserIdSchema,
            response: {
                200: singleCmsUserSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getEditor(request as any, reply),
    })

    fastify.post('/editors', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Create a new editor',
            body: createEditorSchema,
            response: {
                201: singleCmsUserSchema,
            },
        },
        handler: (request, reply) => controller.createEditor(request as any, reply),
    })

    fastify.patch('/editors/:id', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Update an editor',
            params: cmsUserIdSchema,
            body: updateEditorSchema,
            response: {
                200: singleCmsUserSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateEditor(request as any, reply),
    })

    fastify.delete('/editors/:id', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Delete an editor',
            params: cmsUserIdSchema,
            response: {
                204: z.null(),
                400: errorSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteEditor(request as any, reply),
    })

    fastify.get('/:id', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Get a CMS user by ID',
            params: cmsUserIdSchema,
            response: {
                200: singleCmsUserSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getCmsUser(request as any, reply),
    })
}

export default cmsUsersRoutes
