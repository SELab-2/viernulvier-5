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
 * Sanitize requested page number to be within valid bounds.
 * If page > totalPages, it will return totalPages.
 * If page < 1, it will return 1.
 */
export function sanitizePage(page: number, totalPages: number): number {
    if (totalPages === 0) return 1
    return Math.max(1, Math.min(page, totalPages))
}

/**
 * Builds links for a paginated resource.
 * Accepts either a bare path URL (no query string) or a full URL with existing query params.
 * Existing query params are preserved; only `page` and `limit` are overwritten.
 */
export function buildPaginationLinks(requestUrl: string, page: number, limit: number, totalPages: number) {
    const [urlPath, existingQuery] = requestUrl.split('?', 2)
    
    const buildUrl = (p: number) => {
        const params = new URLSearchParams(existingQuery ?? '')
        params.set('page', String(p))
        params.set('limit', String(limit))
        return `${urlPath}?${params.toString()}`
    }
    
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
