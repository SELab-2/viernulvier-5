import type { 
    HallPaginationQuery, 
    HallResponse,
    CreateHallInput,
    UpdateHallInput
} from './halls.schema.js'
import { HallsRepository } from './halls.repository.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class HallsService {
    constructor(private readonly repository: HallsRepository) { }

    async getHalls(options: HallPaginationQuery): Promise<PaginatedResult<HallResponse>> {
        const { page, limit, spaceId, search, lang } = options

        const total = await this.repository.count({ spaceId, search, lang })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAll({ 
            page: sanitizedPage, 
            limit, 
            spaceId, 
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

    async getHall(id: string): Promise<HallResponse | null> {
        return this.repository.findById(id) as any
    }

    async createHall(data: CreateHallInput): Promise<HallResponse> {
        return this.repository.create(data) as any
    }

    async updateHall(id: string, data: UpdateHallInput): Promise<HallResponse> {
        return this.repository.update(id, data) as any
    }

    async deleteHall(id: string): Promise<void> {
        await this.repository.delete(id)
    }
}
