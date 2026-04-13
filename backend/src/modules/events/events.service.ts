import { EventsRepository } from './events.repository.js'
import type { 
    EventPaginationQuery,
    EventPricePaginationQuery,
    UpdateEventInput,
    EventResponse,
    CreateEventInput,
    EventPriceResponse
} from './events.schema.js'
import { PaginatedResult, calculateTotalPages } from '../../utils/pagination.js'

export class EventsService {
    constructor(private readonly repository: EventsRepository) { }

    async getEvents(options: EventPaginationQuery): Promise<PaginatedResult<EventResponse>> {
        const { page, limit, productionId, search, lang } = options

        const [items, total] = await Promise.all([
            this.repository.findAll({ page, limit, productionId, search, lang }),
            this.repository.count({ productionId, search, lang }),
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

    async getPrices(options: EventPricePaginationQuery): Promise<PaginatedResult<EventPriceResponse>> {
        const { page, limit, eventId, search } = options

        const [items, total] = await Promise.all([
            this.repository.findAllPrices({ page, limit, eventId, search }),
            this.repository.countPrices({ eventId, search }),
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

    async getEventPrice(id: string): Promise<EventPriceResponse | null> {
        return this.repository.findPriceById(id) as any
    }

    async getEvent(id: string): Promise<EventResponse | null> {
        return this.repository.findById(id) as any
    }

    async createEvent(data: CreateEventInput): Promise<EventResponse> {
        return this.repository.create(data) as any
    }

    async updateEvent(id: string, data: UpdateEventInput): Promise<EventResponse> {
        return this.repository.update(id, data) as any
    }

    async deleteEvent(id: string): Promise<void> {
        await this.repository.delete(id)
    }
}
