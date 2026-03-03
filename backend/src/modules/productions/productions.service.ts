import { ProductionsRepository } from './productions.repository.js'
import type { PaginationQuery, ProductionListResponse } from './productions.schema.js'

export class ProductionsService {
    constructor(private readonly repository: ProductionsRepository) { }

    async getProductions(options: PaginationQuery): Promise<ProductionListResponse> {
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
