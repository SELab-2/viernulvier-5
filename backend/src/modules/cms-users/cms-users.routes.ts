import type { FastifyPluginAsync } from 'fastify'
import { CmsUsersRepository } from './cms-users.repository.js'
import { CmsUsersService } from './cms-users.service.js'
import { CmsUsersController } from './cms-users.controller.js'
import {
    cmsUserPaginationQuerySchema,
    cmsUserListSchema,
    singleCmsUserSchema,
    createCmsUserSchema,
    updateCmsUserSchema,
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
        preHandler: [requirePermission(Permission.CMS_USERS_MANAGE)],
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

    fastify.get('/:id', {
        preHandler: [requirePermission(Permission.CMS_USERS_MANAGE)],
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

    fastify.post('/', {
        preHandler: [requirePermission(Permission.CMS_USERS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Create a new CMS user',
            body: createCmsUserSchema,
            response: {
                201: singleCmsUserSchema,
            },
        },
        handler: (request, reply) => controller.createCmsUser(request as any, reply),
    })

    fastify.patch('/:id', {
        preHandler: [requirePermission(Permission.CMS_USERS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Update a CMS user',
            params: cmsUserIdSchema,
            body: updateCmsUserSchema,
            response: {
                200: singleCmsUserSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateCmsUser(request as any, reply),
    })

    fastify.delete('/:id', {
        preHandler: [requirePermission(Permission.CMS_USERS_MANAGE)],
        schema: {
            tags: ['cms-users'],
            summary: 'Delete a CMS user',
            params: cmsUserIdSchema,
            response: {
                204: z.null(),
                400: errorSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteCmsUser(request as any, reply),
    })
}

export default cmsUsersRoutes
