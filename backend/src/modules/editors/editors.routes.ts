import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { Permission } from '../../domain/permissions.js'
import { requirePermission } from '../../hooks/require-permission.js'
import { EditorsController } from './editors.controller.js'
import { EditorsRepository } from './editors.repository.js'
import {
    type CreateEditorInput,
    type EditorIdParams,
    type UpdateEditorInput,
    createEditorSchema,
    editorIdParamsSchema,
    updateEditorSchema,
} from './editors.schema.js'
import { EditorsService } from './editors.service.js'

const editorsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new EditorsRepository(fastify.prisma)
    const service = new EditorsService(repository)
    const controller = new EditorsController(service)
    const adminOnly = [requirePermission(Permission.EDITORS_MANAGE)]

    fastify.get('/', {
        preHandler: adminOnly,
        schema: {
            tags: ['editors'],
            summary: 'List editor accounts',
            security: [{ cookieAuth: [] }],
        },
        handler: (request, reply) => controller.list(request, reply),
    })

    fastify.post('/', {
        preHandler: adminOnly,
        schema: {
            body: createEditorSchema,
            tags: ['editors'],
            summary: 'Create a new editor account',
            security: [{ cookieAuth: [] }],
        },
        handler: (request: FastifyRequest<{ Body: CreateEditorInput }>, reply) =>
            controller.create(request, reply),
    })

    fastify.patch('/:id', {
        preHandler: adminOnly,
        schema: {
            params: editorIdParamsSchema,
            body: updateEditorSchema,
            tags: ['editors'],
            summary: 'Update an existing editor account',
            security: [{ cookieAuth: [] }],
        },
        handler: (request: FastifyRequest<{ Params: EditorIdParams, Body: UpdateEditorInput }>, reply) =>
            controller.update(request, reply),
    })

    fastify.delete('/:id', {
        preHandler: adminOnly,
        schema: {
            params: editorIdParamsSchema,
            tags: ['editors'],
            summary: 'Delete an editor account',
            security: [{ cookieAuth: [] }],
        },
        handler: (request: FastifyRequest<{ Params: EditorIdParams }>, reply) =>
            controller.remove(request, reply),
    })
}

export default editorsRoutes
