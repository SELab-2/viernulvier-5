import { OrganisationsRepository } from './organisations.repository.js'
import type { PaginationQuery, OrganisationListResponse, OrganisationResponse } from './organisations.schema.js'

export class OrganisationsService {
    constructor(private readonly repository: OrganisationsRepository) { }

    async getOrganisations(options: PaginationQuery): Promise<OrganisationListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAll({ page, limit, search }),
            this.repository.count(search),
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            data: data as any,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        }
    }

    async getOrganisation(id: string): Promise<OrganisationResponse | null> {
        return this.repository.findById(id) as any
    }
}
