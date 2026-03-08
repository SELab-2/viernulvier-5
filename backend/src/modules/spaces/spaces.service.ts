import type { 
    PaginationQuery, 
    SpaceListResponse, 
    SpaceResponse,
    CreateSpaceInput,
    UpdateSpaceInput
} from './spaces.schema.js'

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
