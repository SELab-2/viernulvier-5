import type { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from './auth.service.js'
import type { LoginInput } from './auth.schema.js'

/**
 * Auth Controller — handles login/logout HTTP requests.
 */
export class AuthController {
    constructor(private readonly service: AuthService) { }

    async login(
        request: FastifyRequest<{ Body: LoginInput }>,
        reply: FastifyReply
    ) {
        const { token } = await this.service.login(request.body)

        // Set JWT as HttpOnly cookie
        reply.setCookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 8 * 60 * 60, // 8 hours
        })

        return reply.send({ success: true })
    }

    async logout(_request: FastifyRequest, reply: FastifyReply) {
        reply.clearCookie('token', { path: '/' })
        return reply.send({ success: true })
    }

    async me(request: FastifyRequest, reply: FastifyReply) {
        return reply.send({ user: request.user })
    }
}
