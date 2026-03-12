import type { FastifyInstance } from 'fastify'
import type { LoginInput } from './auth.schema.js'
import { AppError } from '../../errors/app-error.js'
import { Role } from '../../domain/role.js'
import { env } from '../../config/env.js'

/**
 * Auth Service — handles authentication logic.
 *
 * For now, uses a simple admin user check via environment variables.
 * When the project grows, this can be expanded with database-backed users.
 */
export class AuthService {
    constructor(private readonly app: FastifyInstance) { }

    async login(input: LoginInput) {
        const isValid = input.username === env.ADMIN_USERNAME && input.password === env.ADMIN_PASSWORD

        if (!isValid) {
            throw new AppError('Invalid credentials', 401)
        }

        const token = this.app.jwt.sign(
            {
                sub: 'admin',
                role: Role.ADMIN,
            },
            { expiresIn: '8h' }
        )

        return { token }
    }
}
