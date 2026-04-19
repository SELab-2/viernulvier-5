import { LocationsRepository } from './locations.repository.js'
import type { 
    LocationPaginationQuery, 
    LocationResponse,
    CreateLocationInput,
    UpdateLocationInput
} from './locations.schema.js'
import { PaginatedResult, calculateTotalPages } from '../../utils/pagination.js'

export class LocationsService {
    constructor(private readonly repository: LocationsRepository) { }

    async getLocations(options: LocationPaginationQuery): Promise<PaginatedResult<LocationResponse>> {
        const { page, limit, search, lang } = options

        const [items, total] = await Promise.all([
            this.repository.findAll({ page, limit, search, lang }),
            this.repository.count({ search, lang }),
        ])

        const totalPages = calculateTotalPages(total, limit)

        return {
            items: items as any,
            total,
            page,
            limit,
            totalPages,
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
