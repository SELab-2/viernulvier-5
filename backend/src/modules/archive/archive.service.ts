import { ArchiveRepository } from './archive.repository.js'
<<<<<<< HEAD
=======
import type { 
    PaginationQuery, 
    ProductionListResponse, 
    EventListResponse,
    GenreListResponse,
    LocationListResponse 
} from './archive.schema.js'
>>>>>>> 45610ee (Events, locations en genre toegevoegd)

/**
 * Archive Service
 *
 * Services contain business logic and depend on repositories
 * (never on Prisma directly, never on HTTP concepts).
 */
export class ArchiveService {
    constructor(private readonly repository: ArchiveRepository) { }

<<<<<<< HEAD
    // TODO: implement real business logic methods, e.g.:
    // async getProductions(options: PaginationQuery) { ... }
    // async getProductionById(id: string) { ... }
=======
    /**
     * Business logic for fetching productions with pagination.
     */
    async getProductions(options: PaginationQuery): Promise<ProductionListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllProductions({ page, limit, search }),
            this.repository.countProductions(search),
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            data: data as any, // Cast to any to handle complex Prisma JSON types for now
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        }
    }

    /**
     * Business logic for fetching events with pagination.
     */
    async getEvents(options: PaginationQuery): Promise<EventListResponse> {
        const { page, limit, productionId } = options

        const [data, total] = await Promise.all([
            this.repository.findAllEvents({ page, limit, productionId }),
            this.repository.countEvents(productionId),
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

    /**
     * Business logic for fetching genres with pagination.
     */
    async getGenres(options: PaginationQuery): Promise<GenreListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllGenres({ page, limit, search }),
            this.repository.countGenres(search),
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

    /**
     * Business logic for fetching locations with pagination.
     */
    async getLocations(options: PaginationQuery): Promise<LocationListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllLocations({ page, limit, search }),
            this.repository.countLocations(search),
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
>>>>>>> 45610ee (Events, locations en genre toegevoegd)
}
