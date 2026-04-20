import { ProductionsRepository } from './productions.repository.js'
import type { 
    PaginationQuery, 
    UpdateProductionInput, 
    ProductionResponse,
    CreateProductionInput 
} from './productions.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class ProductionsService {
    constructor(private readonly repository: ProductionsRepository) { }

    async getProductions(options: PaginationQuery): Promise<PaginatedResult<ProductionResponse>> {
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
