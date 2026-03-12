import type { PrismaClient } from '@prisma/client'

/**
 * Archive Repository
 *
 * The repository is the ONLY layer that touches Prisma directly.
 * Services depend on the repository, never on Prisma.
 */
export class ArchiveRepository {
    constructor(private readonly prisma: PrismaClient) { }

    // TODO: implement real data access methods, e.g.:
    // async findAllProductions(options: { page: number; limit: number }) { ... }
    // async findProductionById(id: string) { ... }
}
