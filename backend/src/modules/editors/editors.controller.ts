import type { FastifyReply, FastifyRequest } from 'fastify'
import { EditorsService } from './editors.service.js'
import type {
    CreateEditorInput,
    EditorIdParams,
    UpdateEditorInput,
} from './editors.schema.js'

export class EditorsController {
    constructor(private readonly service: EditorsService) { }

    async list(_request: FastifyRequest, reply: FastifyReply) {
        const editors = await this.service.listEditors()
        return reply.send({ editors })
    }

    async create(
        request: FastifyRequest<{ Body: CreateEditorInput }>,
        reply: FastifyReply
    ) {
        const editor = await this.service.createEditor(request.body)
        return reply.status(201).send({ editor })
    }

    async update(
        request: FastifyRequest<{ Params: EditorIdParams, Body: UpdateEditorInput }>,
        reply: FastifyReply
    ) {
        const editor = await this.service.updateEditor(request.params.id, request.body)
        return reply.send({ editor })
    }

    async remove(
        request: FastifyRequest<{ Params: EditorIdParams }>,
        reply: FastifyReply
    ) {
        await this.service.deleteEditor(request.params.id)
        return reply.status(204).send()
    }
}
