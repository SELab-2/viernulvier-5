import type { FastifyPluginAsync } from 'fastify'
import { OrganisationsRepository } from './organisations.repository.js'
import { OrganisationsService } from './organisations.service.js'
import { OrganisationsController } from './organisations.controller.js'
import { z } from 'zod'
import { 
    paginationQuerySchema, 
    organisationListSchema,
    organisationSchema,
    idParamSchema,
    errorSchema,
    createOrganisationSchema,
    updateOrganisationSchema
} from './organisations.schema.js'
import { requireAuth } from '../../hooks/require-auth.js'

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

    fastify.get('/:id', {
        schema: {
            tags: ['organisations'],
            summary: 'Get an organisation by ID',
            params: idParamSchema,
            response: {
                200: organisationSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.getOrganisation(request as any, reply),
    })

    fastify.post('/', {
        preHandler: [requireAuth],
        schema: {
            tags: ['organisations'],
            summary: 'Create a new organisation',
            body: createOrganisationSchema,
            response: {
                201: organisationSchema,
            },
        },
        handler: (request, reply) => controller.createOrganisation(request as any, reply),
    })

    fastify.put('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['organisations'],
            summary: 'Update an organisation',
            params: idParamSchema,
            body: updateOrganisationSchema,
            response: {
                200: organisationSchema,
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.updateOrganisation(request as any, reply),
    })

    fastify.delete('/:id', {
        preHandler: [requireAuth],
        schema: {
            tags: ['organisations'],
            summary: 'Delete an organisation',
            params: idParamSchema,
            response: {
                204: z.null(),
                404: errorSchema
            },
        },
        handler: (request, reply) => controller.deleteOrganisation(request as any, reply),
    })
}

export default organisationsRoutes
