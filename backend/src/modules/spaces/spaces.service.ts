import type { 
    SpacePaginationQuery, 
    SpaceResponse,
    CreateSpaceInput,
    UpdateSpaceInput
} from './spaces.schema.js'
import { SpacesRepository } from './spaces.repository.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class SpacesService {
    constructor(private readonly repository: SpacesRepository) { }

    async getSpaces(options: SpacePaginationQuery): Promise<PaginatedResult<SpaceResponse>> {
        const { page, limit, locationId, search, lang } = options

        const total = await this.repository.count({ locationId, search, lang })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAll({ 
            page: sanitizedPage, 
            limit, 
            locationId, 
            search, 
            lang 
        })

        return {
            items: items as any,
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getSpace(id: string): Promise<SpaceResponse | null> {
        return this.repository.findById(id) as any
    }

    async createSpace(data: CreateSpaceInput): Promise<SpaceResponse> {
        return this.repository.create(data) as any
    }

    async updateSpace(id: string, data: UpdateSpaceInput): Promise<SpaceResponse> {
        return this.repository.update(id, data) as any
    }

    async deleteSpace(id: string): Promise<void> {
        await this.repository.delete(id)
    }
}
