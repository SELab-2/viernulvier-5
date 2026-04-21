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

/**
 * Clamp a requested page into the available page range.
 */
export function sanitizePage(page: number, totalPages: number): number {
    if (totalPages <= 0) {
        return 1
    }

    return Math.min(Math.max(page, 1), totalPages)
}

/**
 * Builds links for a paginated resource.
 */
export function buildPaginationLinks(baseUrl: string, page: number, limit: number, totalPages: number) {
    const buildUrl = (p: number) => `${baseUrl}?page=${p}&limit=${limit}`
    
    // If we're beyond total pages, prev should lead back to the last valid page
    const prevPage = page > totalPages ? totalPages : page - 1
    
    return {
        self: buildUrl(page),
        next: (totalPages > 0 && page < totalPages) ? buildUrl(page + 1) : null,
        prev: (totalPages > 0 && page > 1 && prevPage > 0) ? buildUrl(prevPage) : null,
        first: totalPages > 0 ? buildUrl(1) : buildUrl(page),
        last: totalPages > 0 ? buildUrl(totalPages) : buildUrl(page),
    }
}
