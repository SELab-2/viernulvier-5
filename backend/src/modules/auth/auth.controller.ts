import type { FastifyRequest, FastifyReply } from 'fastify'
import '@fastify/cookie'
import { AuthService } from './auth.service.js'
import type { LoginInput, UserResponse } from './auth.schema.js'

/**
 * Auth Controller — handles login/logout HTTP requests.
 */
export class AuthController {
    constructor(private readonly service: AuthService) { }

    private getBaseUrl(request: FastifyRequest) {
        const host = request.headers.host || request.hostname
        return `${request.protocol}://${host}/api/v1/auth`
    }

    private mapUserLinks(user: any, baseUrl: string): UserResponse {
        return {
            ...user,
            links: {
                self: `${baseUrl}/me`,
                logout: `${baseUrl}/logout`,
            }
        }
    }

    async login(
        request: FastifyRequest<{ Body: LoginInput }>,
        reply: FastifyReply
    ) {
        const { token, user } = await this.service.login(request.body)

        // Set JWT as HttpOnly cookie
        reply.setCookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 8 * 60 * 60, // 8 hours
        })

        const baseUrl = this.getBaseUrl(request)
        
        return reply.status(200).send({ 
            data: { 
                user: this.mapUserLinks(user, baseUrl)
            },
            links: {
                self: `${baseUrl}/login`
            }
        })
    }

    async logout(request: FastifyRequest, reply: FastifyReply) {
        reply.clearCookie('token', { path: '/' })
        return reply.status(200).send({
            data: { success: true },
            links: {
                self: `${this.getBaseUrl(request)}/logout`
            }
        })
    }

    async me(request: FastifyRequest, reply: FastifyReply) {
        const userId = (request.user as any).sub
        const user = await this.service.getCurrentUser(userId)

        if (!user) {
            return reply.status(404).send({ message: 'User not found' })
        }

        const baseUrl = this.getBaseUrl(request)
        const dataWithLinks = this.mapUserLinks(user, baseUrl)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${baseUrl}/me`
            }
        })
    }
}
