import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { env } from './config/env.js'

// Plugins
import prismaPlugin from './plugins/prisma.js'
import authPlugin from './plugins/auth.js'
import corsPlugin from './plugins/cors.js'
import securityPlugin from './plugins/security.js'
import swaggerPlugin from './plugins/swagger.js'

// Modules
import archiveRoutes from './modules/archive/archive.routes.js'
import authRoutes from './modules/auth/auth.routes.js'

/**
 * Build the Fastify application.
 *
 * This is a factory function so tests can create isolated instances
 * without starting a real HTTP server.
 */
export async function buildApp(opts = {}): Promise<FastifyInstance> {
    const app = Fastify({
        logger: env.NODE_ENV !== 'test' && {
            transport: env.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
        },
        ...opts,
    })

    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    // --- Global plugins (fp-wrapped, available everywhere) ---
    await app.register(corsPlugin)
    await app.register(securityPlugin)
    await app.register(swaggerPlugin)
    await app.register(prismaPlugin)
    await app.register(authPlugin)

    // --- Feature modules ---
    await app.register(archiveRoutes, { prefix: '/api/archive' })
    await app.register(authRoutes, { prefix: '/api/auth' })

    return app
}
