import { SpacesRepository } from './spaces.repository.js'
import type { PaginationQuery, SpaceListResponse, SpaceResponse } from './spaces.schema.js'

export class SpacesService {
    constructor(private readonly repository: SpacesRepository) { }

    async getSpaces(options: PaginationQuery): Promise<SpaceListResponse> {
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

    async getSpace(id: string): Promise<SpaceResponse | null> {
        return this.repository.findById(id) as any
    }
}
