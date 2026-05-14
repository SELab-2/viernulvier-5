const API_BASE = '/api/v1'

export class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

export function normalizeApiAssetUrl(value: string | null | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return undefined
    }

    if (trimmed.startsWith('/api/')) {
        return trimmed
    }

    if (typeof window === 'undefined') {
        return trimmed
    }

    try {
        const url = new URL(trimmed, window.location.origin)

        if (url.pathname.startsWith('/api/')) {
            return `${url.pathname}${url.search}${url.hash}`
        }
    } catch {
        return trimmed
    }

    return trimmed
}

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
    const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData

    const hasBody = options.body !== undefined && options.body !== null
    const defaultHeaders: Record<string, string> = hasBody
        ? !isFormDataBody
        ? { 'Content-Type': 'application/json' }
        : {}
        : {}

    let response: Response

    try {
        response = await fetch(url, {
            credentials: 'include', // Include cookies for auth
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
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

        throw new ApiError(response.status, message)
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
