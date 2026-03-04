import { EventsRepository } from './events.repository.js'
import type { 
    PaginationQuery, 
    EventListResponse, 
    EventPriceListResponse,
    EventStatusListResponse,
    EventExtraListResponse
} from './events.schema.js'

export class EventsService {
    constructor(private readonly repository: EventsRepository) { }

    async getEvents(options: PaginationQuery): Promise<EventListResponse> {
        const { page, limit, productionId } = options

        const [data, total] = await Promise.all([
            this.repository.findAll({ page, limit, productionId }),
            this.repository.count(productionId),
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

    async getPrices(options: PaginationQuery): Promise<EventPriceListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllPrices({ page, limit, search }),
            this.repository.countPrices(search),
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

    async getStatuses(options: PaginationQuery): Promise<EventStatusListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllStatuses({ page, limit, search }),
            this.repository.countStatuses(search),
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

    async getExtras(options: PaginationQuery): Promise<EventExtraListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllExtras({ page, limit, search }),
            this.repository.countExtras(search),
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
