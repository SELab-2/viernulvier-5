import { PricesRepository } from './prices.repository.js'
import type { PaginationQuery, PriceListResponse, RankListResponse } from './prices.schema.js'

export class PricesService {
    constructor(private readonly repository: PricesRepository) { }

    async getPrices(options: PaginationQuery): Promise<PriceListResponse> {
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

    async getRanks(options: PaginationQuery): Promise<RankListResponse> {
        const { page, limit, search } = options

        const [data, total] = await Promise.all([
            this.repository.findAllRanks({ page, limit, search }),
            this.repository.countRanks(search),
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
