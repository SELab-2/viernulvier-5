import type { FastifyReply, FastifyRequest } from 'fastify'
import { UitdatabankService } from './uitdatabank.service.js'
import type { 
    UitdatabankPaginationQuery,
    KeywordResponse,
    ThemeResponse,
    TypeResponse
} from './uitdatabank.schema.js'
import { buildPaginationLinks } from '../../utils/pagination.js'

export class UitdatabankController {
    constructor(private readonly service: UitdatabankService) { }

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/archive/uitdatabank`
    }

    private mapKeywordLinks(keyword: any, baseUrl: string): KeywordResponse {
        return {
            ...keyword,
            links: {
                self: `${baseUrl}/keywords/${keyword.id}`,
                productions: `${baseUrl.replace('/uitdatabank', '')}/productions?keywordId=${keyword.id}`,
            }
        }
    }

    private mapThemeLinks(theme: any, baseUrl: string): ThemeResponse {
        return {
            ...theme,
            links: {
                self: `${baseUrl}/themes/${theme.id}`,
                productions: `${baseUrl.replace('/uitdatabank', '')}/productions?themeId=${theme.id}`,
            }
        }
    }

    private mapTypeLinks(type: any, baseUrl: string): TypeResponse {
        return {
            ...type,
            links: {
                self: `${baseUrl}/types/${type.id}`,
                productions: `${baseUrl.replace('/uitdatabank', '')}/productions?typeId=${type.id}`,
            }
        }
    }

    async getKeywords(request: FastifyRequest<{ Querystring: UitdatabankPaginationQuery }>, reply: FastifyReply) {
        const keywords = await this.service.getKeywords(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/keywords`

        const dataWithLinks = keywords.items.map(k => this.mapKeywordLinks(k, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: keywords.total,
                page: keywords.page,
                limit: keywords.limit,
                totalPages: keywords.totalPages,
            },
            links: buildPaginationLinks(currentUrl, keywords.page, keywords.limit, keywords.totalPages)
        })
    }

    async getKeyword(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const keyword = await this.service.getKeyword(id)

        if (!keyword) {
            return reply.status(404).send({ message: 'Keyword not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapKeywordLinks(keyword, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/keywords/${id}`
            }
        })
    }

    async getThemes(request: FastifyRequest<{ Querystring: UitdatabankPaginationQuery }>, reply: FastifyReply) {
        const themes = await this.service.getThemes(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/themes`

        const dataWithLinks = themes.items.map(t => this.mapThemeLinks(t, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: themes.total,
                page: themes.page,
                limit: themes.limit,
                totalPages: themes.totalPages,
            },
            links: buildPaginationLinks(currentUrl, themes.page, themes.limit, themes.totalPages)
        })
    }

    async getTheme(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const theme = await this.service.getTheme(id)

        if (!theme) {
            return reply.status(404).send({ message: 'Theme not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapThemeLinks(theme, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/themes/${id}`
            }
        })
    }

    async getTypes(request: FastifyRequest<{ Querystring: UitdatabankPaginationQuery }>, reply: FastifyReply) {
        const types = await this.service.getTypes(request.query)
        const baseUrl = this.getBaseUrl(request)
        const currentUrl = `${baseUrl}/types`

        const dataWithLinks = types.items.map(t => this.mapTypeLinks(t, baseUrl))

        return reply.status(200).send({
            data: dataWithLinks,
            meta: {
                total: types.total,
                page: types.page,
                limit: types.limit,
                totalPages: types.totalPages,
            },
            links: buildPaginationLinks(currentUrl, types.page, types.limit, types.totalPages)
        })
    }

    async getType(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        const { id } = request.params
        const type = await this.service.getType(id)

        if (!type) {
            return reply.status(404).send({ message: 'Type not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapTypeLinks(type, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/types/${id}`
            }
        })
    }
}
