import { DashboardRepository } from './dashboard.repository.js'

type GetSummaryOptions = {
    page: number
    limit: number
}

export class DashboardService {
    constructor(private readonly repository: DashboardRepository) {}

    async getSummary(options: GetSummaryOptions) {
        return this.repository.getSummary(options)
    }
}
