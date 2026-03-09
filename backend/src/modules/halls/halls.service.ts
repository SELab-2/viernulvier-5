import type { 
    PaginationQuery, 
    HallListResponse, 
    HallResponse,
    CreateHallInput,
    UpdateHallInput
} from './halls.schema.js'
import { HallsRepository } from './halls.repository.js'

export class HallsService {
    constructor(private readonly repository: HallsRepository) { }

    async getHalls(options: PaginationQuery): Promise<HallListResponse> {
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
