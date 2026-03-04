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
import productionsRoutes from './modules/productions/productions.routes.js'
import eventsRoutes from './modules/events/events.routes.js'
import taxonomiesRoutes from './modules/taxonomies/taxonomies.routes.js'
import locationsRoutes from './modules/locations/locations.routes.js'
import hallsRoutes from './modules/halls/halls.routes.js'
import spacesRoutes from './modules/spaces/spaces.routes.js'
import mediaRoutes from './modules/media/media.routes.js'
import organisationsRoutes from './modules/organisations/organisations.routes.js'
import authRoutes from './modules/auth/auth.routes.js'
import pricesRoutes from './modules/prices/prices.routes.js'

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
    await app.register(productionsRoutes, { prefix: '/api/archive/productions' })
    await app.register(eventsRoutes, { prefix: '/api/archive/events' })
    await app.register(taxonomiesRoutes, { prefix: '/api/archive/genres' })
    await app.register(locationsRoutes, { prefix: '/api/archive/locations' })
    await app.register(hallsRoutes, { prefix: '/api/archive/halls' })
    await app.register(spacesRoutes, { prefix: '/api/archive/spaces' })
    await app.register(mediaRoutes, { prefix: '/api/archive/media' })
    await app.register(organisationsRoutes, { prefix: '/api/archive/organisations' })
    await app.register(pricesRoutes, { prefix: '/api/archive/prices' })
    await app.register(authRoutes, { prefix: '/api/auth' })

    return app
}
