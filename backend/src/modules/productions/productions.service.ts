import { ProductionsRepository } from './productions.repository.js'
import type { 
    PaginationQuery, 
    UpdateProductionInput, 
    ProductionResponse,
    CreateProductionInput 
} from './productions.schema.js'
import { PaginatedResult, calculateTotalPages } from '../../utils/pagination.js'

export class ProductionsService {
    constructor(private readonly repository: ProductionsRepository) { }

    async getProductions(options: PaginationQuery): Promise<PaginatedResult<ProductionResponse>> {
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

    async getProduction(id: string): Promise<ProductionResponse | null> {
        return this.repository.findById(id) as any
    }

    async createProduction(data: CreateProductionInput): Promise<ProductionResponse> {
        return this.repository.create(data) as any
    }

    async updateProduction(id: string, data: UpdateProductionInput): Promise<ProductionResponse> {
        return this.repository.update(id, data) as any
    }

    async deleteProduction(id: string): Promise<void> {
        await this.repository.delete(id)
    }
}
