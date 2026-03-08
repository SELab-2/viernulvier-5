import { LocationsRepository } from './locations.repository.js'
import type { 
    PaginationQuery, 
    LocationListResponse, 
    LocationResponse,
    CreateLocationInput,
    UpdateLocationInput
} from './locations.schema.js'

export class LocationsService {
    constructor(private readonly repository: LocationsRepository) { }

    async getLocations(options: PaginationQuery): Promise<LocationListResponse> {
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

    async getLocation(id: string): Promise<LocationResponse | null> {
        return this.repository.findById(id) as any
    }

    async createLocation(data: CreateLocationInput): Promise<LocationResponse> {
        return this.repository.create(data) as any
    }

    async updateLocation(id: string, data: UpdateLocationInput): Promise<LocationResponse> {
        return this.repository.update(id, data) as any
    }

    async deleteLocation(id: string): Promise<void> {
        await this.repository.delete(id)
    }
}
