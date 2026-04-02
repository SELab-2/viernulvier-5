import { DashboardRepository } from './dashboard.repository.js'

export class DashboardService {
    constructor(private readonly repository: DashboardRepository) {}

    async getSummary() {
        return this.repository.getSummary()
    }
}
