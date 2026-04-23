import type { FastifyRequest, FastifyReply } from 'fastify'
import '@fastify/cookie'
import { AuthService } from './auth.service.js'
import type { LoginInput, UpdateMeInput, UserResponse } from './auth.schema.js'

/**
 * Auth Controller — handles login/logout HTTP requests.
 */
export class AuthController {
    constructor(private readonly service: AuthService) { }

    private getBasePath() {
        return '/api/v1/auth'
    }

    private mapUserLinks(user: any): UserResponse {
        const basePath = this.getBasePath()
        return {
            ...user,
            links: {
                self: `${basePath}/me`,
                logout: `${basePath}/logout`,
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

        const basePath = this.getBasePath()

        return reply.status(200).send({
            data: {
                user: this.mapUserLinks(user)
            },
            links: {
                self: `${basePath}/login`
            }
        })
    }

    async logout(_request: FastifyRequest, reply: FastifyReply) {
        reply.clearCookie('token', { path: '/' })
        return reply.status(200).send({
            data: { success: true },
            links: {
                self: `${this.getBasePath()}/logout`
            }
        })
    }

    async me(request: FastifyRequest, reply: FastifyReply) {
        const userId = (request.user as any).sub
        const user = await this.service.getCurrentUser(userId)

        if (!user) {
            return reply.status(404).send({ message: 'User not found' })
        }

        const basePath = this.getBasePath()
        const dataWithLinks = this.mapUserLinks(user)

        return reply.status(200).send({
            data: dataWithLinks,
            links: {
                self: `${basePath}/me`
            }
        })
    }

    async updateMe(
        request: FastifyRequest<{ Body: UpdateMeInput }>,
        reply: FastifyReply
    ) {
        const userId = (request.user as any).sub
        const user = await this.service.updateCurrentUser(userId, request.body)
        const basePath = this.getBasePath()

        return reply.status(200).send({
            data: this.mapUserLinks(user),
            links: {
                self: `${basePath}/me`
            }
        })
    }
}
