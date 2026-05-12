import type { FastifyReply, FastifyRequest } from 'fastify'
import { CmsUsersService } from './cms-users.service.js'
import type {
    CmsUserPaginationQuery,
    CreateCmsUserInput,
    UpdateCmsUserInput,
    CmsUserIdParams,
    CmsUserResponse
} from './cms-users.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class CmsUsersController {
    constructor(private readonly service: CmsUsersService) { }

    private getBaseUrl(request: FastifyRequest): string {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/cms-users`
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
        const baseUrl = this.getBaseUrl(request)
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

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapCmsUserLinks(cmsUser, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/${id}`
            }
        })
    }

    async createCmsUser(request: FastifyRequest<{ Body: CreateCmsUserInput }>, reply: FastifyReply) {
        const cmsUser = await this.service.createCmsUser(request.body)
        const baseUrl = this.getBaseUrl(request)
        const selfUrl = `${baseUrl}/${cmsUser.id}`
        const dataWithLinks = this.mapCmsUserLinks(cmsUser, baseUrl)

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

    async updateCmsUser(request: FastifyRequest<{ Params: CmsUserIdParams, Body: UpdateCmsUserInput }>, reply: FastifyReply) {
        const { id } = request.params
        const cmsUser = await this.service.updateCmsUser(id, request.body)
        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapCmsUserLinks(cmsUser, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/${id}`
            }
        })
    }

    async deleteCmsUser(request: FastifyRequest<{ Params: CmsUserIdParams }>, reply: FastifyReply) {
        const { id } = request.params
        await this.service.deleteCmsUser(id, request.user.sub)
        return reply.status(204).send()
    }
}
