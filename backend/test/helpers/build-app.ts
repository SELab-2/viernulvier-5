import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'

/**
 * Build a Fastify instance for testing.
 *
 * This creates a lightweight app instance that can be used with
 * `app.inject()` to test routes without starting a real HTTP server.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
    // Import buildApp dynamically so env vars can be set before import
    const { buildApp } = await import('../../src/app.js')
    return buildApp({ logger: false })
}
