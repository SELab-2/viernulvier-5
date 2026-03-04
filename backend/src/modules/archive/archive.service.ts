import { ArchiveRepository } from './archive.repository.js'

/**
 * Archive Service
 *
 * Services contain business logic and depend on repositories
 * (never on Prisma directly, never on HTTP concepts).
 */
export class ArchiveService {
    constructor(private readonly repository: ArchiveRepository) { }

    // TODO: implement real business logic methods, e.g.:
    // async getProductions(options: PaginationQuery) { ... }
    // async getProductionById(id: string) { ... }
}
