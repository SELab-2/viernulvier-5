import { OrganisationsRepository } from './organisations.repository.js'
import type { 
    PaginationQuery, 
    OrganisationListResponse, 
    OrganisationResponse,
    CreateOrganisationInput,
    UpdateOrganisationInput
} from './organisations.schema.js'

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

    async createOrganisation(data: CreateOrganisationInput): Promise<OrganisationResponse> {
        return this.repository.create(data) as any
    }

    async updateOrganisation(id: string, data: UpdateOrganisationInput): Promise<OrganisationResponse> {
        return this.repository.update(id, data) as any
    }

    async deleteOrganisation(id: string): Promise<void> {
        await this.repository.delete(id)
    }
}
