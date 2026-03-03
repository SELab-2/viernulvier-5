import type { PrismaClient } from '../../generated/prisma/client.js'

/**
 * Archive Repository
 *
 * The repository is the ONLY layer that touches Prisma directly.
 * Services depend on the repository, never on Prisma.
 */
export class ArchiveRepository {
    constructor(private readonly prisma: PrismaClient) { }

<<<<<<< HEAD
    // TODO: implement real data access methods, e.g.:
    // async findAllProductions(options: { page: number; limit: number }) { ... }
    // async findProductionById(id: string) { ... }
=======
    /**
     * Get a paginated list of productions from the database.
     */
    async findAllProductions(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            title: {
                path: ['nl'], // Assuming Dutch title is in a JSON field
                string_contains: search,
            },
        } : {}

        return this.prisma.production.findMany({
            where: where as any, // casting because of complex JSON path types
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                title: true,
                artist: true,
                description: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    /**
     * Count total number of productions for pagination metadata.
     */
    async countProductions(search?: string) {
        const where = search ? {
            title: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.production.count({
            where: where as any,
        })
    }

    /**
     * Get a paginated list of events from the database.
     */
    async findAllEvents(options: { page: number; limit: number; productionId?: string }) {
        const { page, limit, productionId } = options
        const skip = (page - 1) * limit

        const where = productionId ? { production_id: productionId } : {}

        return this.prisma.event.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { starts_at: 'desc' },
            select: {
                id: true,
                starts_at: true,
                ends_at: true,
                doors_at: true,
                production_id: true,
                info: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    /**
     * Count total number of events for pagination metadata.
     */
    async countEvents(productionId?: string) {
        const where = productionId ? { production_id: productionId } : {}

        return this.prisma.event.count({
            where: where as any,
        })
    }

    /**
     * Get a paginated list of genres from the database.
     */
    async findAllGenres(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.genre.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                type: true,
                name: true,
                slug: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    /**
     * Count total number of genres for pagination metadata.
     */
    async countGenres(search?: string) {
        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.genre.count({
            where: where as any,
        })
    }

    /**
     * Get a paginated list of locations from the database.
     */
    async findAllLocations(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.location.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                name: true,
                city: true,
                street: true,
                created_at: true,
                updated_at: true,
            },
        })
    }

    /**
     * Count total number of locations for pagination metadata.
     */
    async countLocations(search?: string) {
        const where = search ? {
            name: {
                path: ['nl'],
                string_contains: search,
            },
        } : {}

        return this.prisma.location.count({
            where: where as any,
        })
    }
>>>>>>> 45610ee (Events, locations en genre toegevoegd)
}
