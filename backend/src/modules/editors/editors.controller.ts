import type { FastifyReply, FastifyRequest } from 'fastify'
import { EditorsService } from './editors.service.js'
import type { 
    EditorPaginationQuery, 
    CreateEditorInput, 
    UpdateEditorInput,
    EditorIdParams,
    EditorResponse
} from './editors.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class EditorsController {
    constructor(private readonly service: EditorsService) { }

    private getBaseUrl() {
        return '/api/v1/editors'
    }

    private mapEditorLinks(editor: any, baseUrl: string): EditorResponse {
        return {
            ...editor,
            links: {
                self: `${baseUrl}/${editor.id}`,
            }
        }
    }

    async getEditors(request: FastifyRequest<{ Querystring: EditorPaginationQuery }>, reply: FastifyReply) {
        const editors = await this.service.getEditors(request.query)
        const baseUrl = this.getBaseUrl()
        const currentUrl = baseUrl

        const dataWithLinks = editors.items.map(e => this.mapEditorLinks(e, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: editors.total,
                page: editors.page,
                limit: editors.limit,
                totalPages: editors.totalPages,
            },
            links: buildPaginationLinks(currentUrl, editors.page, editors.limit, editors.totalPages)
        })
    }

    async getEditor(request: FastifyRequest<{ Params: EditorIdParams }>, reply: FastifyReply) {
        const { id } = request.params
        const editor = await this.service.getEditor(id)

        if (!editor) {
            return reply.status(404).send({ message: 'Editor not found' })
        }

        const baseUrl = this.getBaseUrl()
        const dataWithLinks = this.mapEditorLinks(editor, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/${id}`
            }
        })
    }

    async createEditor(request: FastifyRequest<{ Body: CreateEditorInput }>, reply: FastifyReply) {
        const editor = await this.service.createEditor(request.body)
        const baseUrl = this.getBaseUrl()
        const selfUrl = `${baseUrl}/${editor.id}`
        
        const dataWithLinks = this.mapEditorLinks(editor, baseUrl)

        return reply
            .status(201)
            .header('Location', selfUrl)
            .send({
                data: dataWithLinks,
                links: {
                    self: selfUrl
                }
            })
    }

    async updateEditor(request: FastifyRequest<{ Params: EditorIdParams, Body: UpdateEditorInput }>, reply: FastifyReply) {
        const { id } = request.params
        const editor = await this.service.updateEditor(id, request.body)
        const baseUrl = this.getBaseUrl()
        const dataWithLinks = this.mapEditorLinks(editor, baseUrl)
        
        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/${id}`
            }
        })
    }

    async deleteEditor(request: FastifyRequest<{ Params: EditorIdParams }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteEditor(id)
        return reply.status(204).send()
    }
}
