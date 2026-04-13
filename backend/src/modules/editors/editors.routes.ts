import type { FastifyPluginAsync } from 'fastify'
import { EditorsRepository } from './editors.repository.js'
import { EditorsService } from './editors.service.js'
import { EditorsController } from './editors.controller.js'
import { 
    editorPaginationQuerySchema,
    editorListSchema,
    singleEditorSchema,
    createEditorSchema,
    updateEditorSchema,
    editorIdSchema,
    errorSchema
} from './editors.schema.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { Permission } from '../../domain/permissions.js'
import { z } from 'zod'

const editorsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new EditorsRepository(fastify.prisma)
    const service = new EditorsService(repository)
    const controller = new EditorsController(service)

    // GET /api/v1/editors
    fastify.get('/', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)], // Adjust permission as needed
        schema: {
            tags: ['editors'],
            summary: 'Get all editors',
            querystring: editorPaginationQuerySchema,
            response: {
                200: editorListSchema,
            },
        },
        handler: (request, reply) => controller.getEditors(request as any, reply),
    })

    // GET /api/v1/editors/:id
    fastify.get('/:id', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['editors'],
            summary: 'Get an editor by ID',
            params: editorIdSchema,
            response: {
                200: singleEditorSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getEditor(request as any, reply),
    })

    // POST /api/v1/editors
    fastify.post('/', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['editors'],
            summary: 'Create a new editor',
            body: createEditorSchema,
            response: {
                201: singleEditorSchema,
            },
        },
        handler: (request, reply) => controller.createEditor(request as any, reply),
    })

    // PATCH /api/v1/editors/:id
    fastify.patch('/:id', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['editors'],
            summary: 'Update an editor',
            params: editorIdSchema,
            body: updateEditorSchema,
            response: {
                200: singleEditorSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateEditor(request as any, reply),
    })

    // DELETE /api/v1/editors/:id
    fastify.delete('/:id', {
        preHandler: [requirePermission(Permission.EDITORS_MANAGE)],
        schema: {
            tags: ['editors'],
            summary: 'Delete an editor',
            params: editorIdSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteEditor(request as any, reply),
    })
}

export default editorsRoutes
