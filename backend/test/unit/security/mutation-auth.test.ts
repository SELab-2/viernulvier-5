import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from '../../helpers/build-app.js'

/**
 * 401 coverage sweep for every state-changing route.
 *
 * Every POST/PATCH/DELETE under `/api/v1/...` must reject anonymous requests
 * with HTTP 401 before any business logic runs. This guards against
 * regressions where someone adds a new mutation route and forgets the
 * `requirePermission(...)` preHandler.
 *
 * The payloads below are schema-valid minimal bodies so the auth guard fires
 * (Fastify runs preValidation before preHandler — sending an invalid body
 * would mask 401 with a 400 from the schema validator).
 */

type MutationMethod = 'POST' | 'PATCH' | 'DELETE'

type MutationRoute = {
    method: MutationMethod
    url: string
    payload?: unknown
}

const PLACEHOLDER_UUID = '00000000-0000-0000-0000-000000000000'

const MUTATION_ROUTES: MutationRoute[] = [
    // auth — payload must satisfy the `at least one updatable field` refine
    { method: 'PATCH', url: '/api/v1/auth/me', payload: { username: 'auth-sweep-user' } },

    // blogs
    { method: 'POST', url: '/api/v1/archive/blogs', payload: { productionIds: [] } },
    { method: 'PATCH', url: `/api/v1/archive/blogs/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/blogs/${PLACEHOLDER_UUID}` },

    // editors
    { method: 'POST', url: '/api/v1/cms-users/editors', payload: { username: 'auth-sweep-user', password: 'sweep-pass' } },
    { method: 'PATCH', url: `/api/v1/cms-users/editors/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/cms-users/editors/${PLACEHOLDER_UUID}` },

    // events
    { method: 'POST', url: '/api/v1/archive/events', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/events/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/events/${PLACEHOLDER_UUID}` },

    // halls
    { method: 'POST', url: '/api/v1/archive/halls', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/halls/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/halls/${PLACEHOLDER_UUID}` },

    // locations
    { method: 'POST', url: '/api/v1/archive/locations', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/locations/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/locations/${PLACEHOLDER_UUID}` },

    // media — galleries
    { method: 'POST', url: '/api/v1/archive/media/galleries', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/media/galleries/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/media/galleries/${PLACEHOLDER_UUID}` },

    // media — items
    { method: 'POST', url: '/api/v1/archive/media/items', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/media/items/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/media/items/${PLACEHOLDER_UUID}` },

    // media — crops
    { method: 'POST', url: '/api/v1/archive/media/items/crops', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/media/items/crops/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/media/items/crops/${PLACEHOLDER_UUID}` },

    // productions
    { method: 'POST', url: '/api/v1/archive/productions', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/productions/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/productions/${PLACEHOLDER_UUID}` },

    // spaces
    { method: 'POST', url: '/api/v1/archive/spaces', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/spaces/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/spaces/${PLACEHOLDER_UUID}` },

    // taxonomies — genres
    { method: 'POST', url: '/api/v1/archive/genres', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/genres/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/genres/${PLACEHOLDER_UUID}` },

    // taxonomies — tags
    { method: 'POST', url: '/api/v1/archive/tags', payload: {} },
    { method: 'PATCH', url: `/api/v1/archive/tags/${PLACEHOLDER_UUID}`, payload: {} },
    { method: 'DELETE', url: `/api/v1/archive/tags/${PLACEHOLDER_UUID}` },
]

describe('Mutation routes require authentication (401 sweep)', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildTestApp()
    })

    afterAll(async () => {
        await app.close()
    })

    it.each(MUTATION_ROUTES)(
        'rejects anonymous $method $url with 401',
        async ({ method, url, payload }) => {
            const response = await app.inject({
                method,
                url,
                payload,
            })

            expect(response.statusCode).toBe(401)
        },
    )
})
