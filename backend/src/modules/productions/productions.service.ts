import { ProductionsRepository } from './productions.repository.js'
import type { 
    PaginationQuery, 
    ProductionListResponse, 
    UpdateProductionInput, 
    ProductionResponse,
    CreateProductionInput 
} from './productions.schema.js'

export class ProductionsService {
    constructor(private readonly repository: ProductionsRepository) { }

    async getProductions(options: PaginationQuery): Promise<ProductionListResponse> {
        const { page, limit, search, lang } = options

        const [data, total] = await Promise.all([
            this.repository.findAll({ page, limit, search, lang }),
            this.repository.count({ search, lang }),
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
