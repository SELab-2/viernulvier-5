import { LocationsRepository } from './locations.repository.js'
import type { 
    PaginationQuery, 
    LocationListResponse, 
    HallListResponse, 
    SpaceListResponse,
    LocationResponse,
    HallResponse,
    SpaceResponse
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

    async getHalls(options: PaginationQuery): Promise<HallListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllHalls({ page, limit, search }),
            this.repository.countHalls(search),
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
        return this.repository.findHallById(id) as any
    }

    async getSpaces(options: PaginationQuery): Promise<SpaceListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllSpaces({ page, limit, search }),
            this.repository.countSpaces(search),
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
        return this.repository.findSpaceById(id) as any
    }
}
