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
    const hasBody = options.body !== undefined && options.body !== null
    const normalizedHeaders = new Headers(options.headers)

    if (hasBody && !normalizedHeaders.has('Content-Type')) {
        normalizedHeaders.set('Content-Type', 'application/json')
    }

    let response: Response

    try {
        response = await fetch(url, {
            credentials: 'include', // Include cookies for auth
            headers: normalizedHeaders,
            ...options,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Network request failed'
        throw new Error(`Network error while requesting ${url}: ${message}`)
    }

    if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? ''
        const errorPayload = contentType.includes('application/json')
            ? await response.json().catch(() => null)
            : await response.text().catch(() => '')

        const message =
            (typeof errorPayload === 'object' && errorPayload !== null && 'message' in errorPayload
                ? String((errorPayload as { message?: unknown }).message ?? '')
                : typeof errorPayload === 'object' && errorPayload !== null && 'error' in errorPayload
                    ? String((errorPayload as { error?: unknown }).error ?? '')
                : typeof errorPayload === 'string'
                    ? errorPayload
                    : '') || `HTTP ${response.status}`

        throw new Error(message)
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

    delete: <T>(endpoint: string) =>
        apiFetch<T>(endpoint, { method: 'DELETE' }),
}
