import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import { env } from '../config/env.js'

/**
 * Auth plugin — sets up JWT with HttpOnly cookie support.
 * Wrapped with fp() so `fastify.jwt` is available globally.
 */
export default fp(async (fastify) => {
    await fastify.register(fastifyCookie)

    await fastify.register(fastifyJwt, {
        secret: env.JWT_SECRET,
        cookie: {
            cookieName: 'token',
            signed: false,
        },
    })
})
