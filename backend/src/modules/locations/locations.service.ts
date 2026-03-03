import { LocationsRepository } from './locations.repository.js'
import type { PaginationQuery, LocationListResponse } from './locations.schema.js'

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
}
