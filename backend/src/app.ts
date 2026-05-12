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
import errorHandlerPlugin from './plugins/error-handler.js'

// Modules
import productionsRoutes from './modules/productions/productions.routes.js'
import eventsRoutes from './modules/events/events.routes.js'
import taxonomiesRoutes from './modules/taxonomies/taxonomies.routes.js'
import locationsRoutes from './modules/locations/locations.routes.js'
import hallsRoutes from './modules/halls/halls.routes.js'
import spacesRoutes from './modules/spaces/spaces.routes.js'
import mediaRoutes from './modules/media/media.routes.js'
import authRoutes from './modules/auth/auth.routes.js'
import editorsRoutes from './modules/editors/editors.routes.js'
import blogsRoutes from './modules/blogs/blogs.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
import searchRoutes from './modules/search/search.routes.js'
import imagesRoutes from './modules/images/images.routes.js'

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
    await app.register(errorHandlerPlugin)

    // --- Feature modules ---
    // Register specific modules at their respective prefixes to preserve sub-routes
    await app.register(productionsRoutes, { prefix: '/api/v1/archive/productions' })
    await app.register(eventsRoutes, { prefix: '/api/v1/archive/events' })
    await app.register(locationsRoutes, { prefix: '/api/v1/archive/locations' })

    // Taxonomies handles both /genres and /tags under /api/archive
    await app.register(taxonomiesRoutes, { prefix: '/api/v1/archive' })

    await app.register(hallsRoutes, { prefix: '/api/v1/archive/halls' })
    await app.register(spacesRoutes, { prefix: '/api/v1/archive/spaces' })
    await app.register(mediaRoutes, { prefix: '/api/v1/archive/media' })
    await app.register(blogsRoutes, { prefix: '/api/v1/archive/blogs' })
    await app.register(searchRoutes, { prefix: '/api/v1/archive/search' })
    await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' })
    await app.register(authRoutes, { prefix: '/api/v1/auth' })
    await app.register(editorsRoutes, { prefix: '/api/v1/editors' })
    await app.register(imagesRoutes, { prefix: '/api/v1/images' })

    return app
}
