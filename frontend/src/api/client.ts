const API_BASE = '/api/v1'

/**
 * API client for communicating with the Fastify backend.
 *
 * In development, Vite proxies /api to http://localhost:3001.
 * In production, Nginx handles the proxying.
 */
export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${endpoint}`

    // Only send Content-Type when there is a body to avoid servers
    // rejecting bodyless DELETE requests with 'Body cannot be empty
    // when content-type is set to application/json'.
    const hasBody = options.body !== undefined && options.body !== null
    const defaultHeaders: Record<string, string> = hasBody
        ? { 'Content-Type': 'application/json' }
        : {}

    const response = await fetch(url, {
        credentials: 'include', // Include cookies for auth
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(error.message || error.error || `HTTP ${response.status}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T
    }

    return response.json()
}

// Convenience methods
export const api = {
    get: <T>(endpoint: string) => apiFetch<T>(endpoint),

    post: <T>(endpoint: string, body: unknown) =>
        apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

    put: <T>(endpoint: string, body: unknown) =>
        apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

    patch: <T>(endpoint: string, body: unknown) =>
        apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: <T>(endpoint: string) =>
        apiFetch<T>(endpoint, { method: 'DELETE' }),
}
