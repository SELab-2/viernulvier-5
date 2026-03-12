import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'
import { env } from '../config/env.js'

/**
 * Security plugin — adds security headers via Helmet.
 */
export default fp(async (fastify) => {
    await fastify.register(helmet, {
        contentSecurityPolicy: env.NODE_ENV === 'development'
            ? false
            : {
                directives: {
                    defaultSrc: ["'self'"],
                    baseUri: ["'self'"],
                    connectSrc: ["'self'", 'https:'],
                    fontSrc: ["'self'", 'https:', 'data:'],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    objectSrc: ["'none'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
                    frameAncestors: ["'self'"],
                    formAction: ["'self'"],
                },
            },
    })
})
