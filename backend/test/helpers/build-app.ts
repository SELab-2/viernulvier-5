import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'

/**
 * Build a Fastify instance for testing.
 *
 * This creates a lightweight app instance that can be used with
 * `app.inject()` to test routes without starting a real HTTP server.
 *
 * Usage:
 * ```typescript
 * import { buildTestApp } from '../helpers/build-app'
 *
 * describe('Archive Routes', () => {
 *   let app: FastifyInstance
 *
 *   beforeEach(async () => {
 *     app = await buildTestApp()
 *   })
 *
 *   afterEach(async () => {
 *     await app.close()
 *   })
 *
 *   it('GET /api/health returns 200', async () => {
 *     const response = await app.inject({ method: 'GET', url: '/api/health' })
 *     expect(response.statusCode).toBe(200)
 *   })
 * })
 * ```
 */
export async function buildTestApp(): Promise<FastifyInstance> {
    // Import buildApp dynamically so env vars can be set before import
    const { buildApp } = await import('../../src/app.js')
    return buildApp({ logger: false })
}
