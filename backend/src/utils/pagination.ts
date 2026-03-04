/**
 * Pagination helper utilities.
 */

export interface PaginatedResult<T> {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * Calculate total pages from item count and page limit.
 */
export function calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit)
}
