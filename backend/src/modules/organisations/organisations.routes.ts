import type { FastifyPluginAsync } from 'fastify'
import { OrganisationsRepository } from './organisations.repository.js'
import { OrganisationsService } from './organisations.service.js'
import { OrganisationsController } from './organisations.controller.js'
import { paginationQuerySchema, organisationListSchema } from './organisations.schema.js'

const organisationsRoutes: FastifyPluginAsync = async (fastify) => {
    const repository = new OrganisationsRepository(fastify.prisma)
    const service = new OrganisationsService(repository)
    const controller = new OrganisationsController(service)

    fastify.get('/', {
        schema: {
            tags: ['organisations'],
            summary: 'Get a paginated list of organisations',
            querystring: paginationQuerySchema,
            response: {
                200: organisationListSchema,
            },
        },
        handler: (request, reply) => controller.getOrganisations(request as any, reply),
    })
}

export default organisationsRoutes
