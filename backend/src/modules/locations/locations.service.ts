import { LocationsRepository } from './locations.repository.js'
import type { 
    LocationPaginationQuery, 
    LocationResponse,
    CreateLocationInput,
    UpdateLocationInput
} from './locations.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class LocationsService {
    constructor(private readonly repository: LocationsRepository) { }

    async getLocations(options: LocationPaginationQuery): Promise<PaginatedResult<LocationResponse>> {
        const { page, limit, search, lang } = options

        const total = await this.repository.count({ search, lang })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.findAll({ 
            page: sanitizedPage, 
            limit, 
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
