import type { FastifyReply, FastifyRequest } from 'fastify'
import { CmsUsersService } from './cms-users.service.js'
import type {
    CmsUserPaginationQuery,
    CreateEditorInput,
    UpdateEditorInput,
    CmsUserIdParams,
    CmsUserResponse
} from './cms-users.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class CmsUsersController {
    constructor(private readonly service: CmsUsersService) { }

    private getBaseUrl(path = ''): string {
        return `/api/v1/cms-users${path}`
    }

    private mapCmsUserLinks(cmsUser: CmsUserResponse, baseUrl: string): CmsUserResponse {
        return {
            ...cmsUser,
            links: {
                self: `${baseUrl}/${cmsUser.id}`,
            }
        }
    }

    async getCmsUsers(request: FastifyRequest<{ Querystring: CmsUserPaginationQuery }>, reply: FastifyReply) {
        const cmsUsers = await this.service.getCmsUsers(request.query)
        const baseUrl = this.getBaseUrl()
        const dataWithLinks = cmsUsers.items.map((cmsUser) => this.mapCmsUserLinks(cmsUser, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: cmsUsers.total,
                page: cmsUsers.page,
                limit: cmsUsers.limit,
                totalPages: cmsUsers.totalPages,
            },
            links: buildPaginationLinks(baseUrl, cmsUsers.page, cmsUsers.limit, cmsUsers.totalPages)
        })
    }

    async getCmsUser(request: FastifyRequest<{ Params: CmsUserIdParams }>, reply: FastifyReply) {
        const { id } = request.params
        const cmsUser = await this.service.getCmsUser(id)

        if (!cmsUser) {
            return reply.status(404).send({ message: 'CMS user not found' })
        }

        const baseUrl = this.getBaseUrl()
        const dataWithLinks = this.mapCmsUserLinks(cmsUser, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/${id}`
            }
        })
    }

    async getEditors(request: FastifyRequest<{ Querystring: CmsUserPaginationQuery }>, reply: FastifyReply) {
        const editors = await this.service.getEditors(request.query)
        const baseUrl = this.getBaseUrl('/editors')
        const dataWithLinks = editors.items.map((editor) => this.mapCmsUserLinks(editor, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: editors.total,
                page: editors.page,
                limit: editors.limit,
                totalPages: editors.totalPages,
            },
            links: buildPaginationLinks(baseUrl, editors.page, editors.limit, editors.totalPages)
        })
    }

    async getEditor(request: FastifyRequest<{ Params: CmsUserIdParams }>, reply: FastifyReply) {
        const { id } = request.params
        const editor = await this.service.getEditor(id)

        if (!editor) {
            return reply.status(404).send({ message: 'Editor not found' })
        }

        const baseUrl = this.getBaseUrl('/editors')
        const dataWithLinks = this.mapCmsUserLinks(editor, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/${id}`
            }
        })
    }

    async createEditor(request: FastifyRequest<{ Body: CreateEditorInput }>, reply: FastifyReply) {
        const editor = await this.service.createEditor(request.body)
        const baseUrl = this.getBaseUrl('/editors')
        const selfUrl = `${baseUrl}/${editor.id}`
        const dataWithLinks = this.mapCmsUserLinks(editor, baseUrl)

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

    async updateEditor(request: FastifyRequest<{ Params: CmsUserIdParams, Body: UpdateEditorInput }>, reply: FastifyReply) {
        const { id } = request.params
        const editor = await this.service.updateEditor(id, request.body)
        const baseUrl = this.getBaseUrl('/editors')
        const dataWithLinks = this.mapCmsUserLinks(editor, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/${id}`
            }
        })
    }

    async deleteEditor(request: FastifyRequest<{ Params: CmsUserIdParams }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteEditor(id, request.user.sub)
        return reply.status(204).send()
    }
}
