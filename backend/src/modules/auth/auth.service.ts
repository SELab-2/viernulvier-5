import type { LoginInput } from './auth.schema.js'
import { AuthRepository } from './auth.repository.js'
import { AppError } from '../../errors/app-error.js'
import { Role } from '../../domain/role.js'
import { verifyPassword } from '../../utils/password.js'

function toDomainRole(role: string): Role {
    if (role === Role.ADMIN) {
        return Role.ADMIN
    }

    if (role === Role.EDITOR) {
        return Role.EDITOR
    }

    throw new AppError('Invalid user role', 500)
}

type AuthTokenPayload = {
    sub: string
    username: string
    role: Role
}

/**
 * Auth Service — handles authentication logic.
 *
 * Uses the users table for authentication and stores only password hashes.
 */
export class AuthService {
    constructor(
        private readonly repository: AuthRepository,
        private readonly signToken: (payload: AuthTokenPayload) => string
    ) { }

    async login(input: LoginInput) {
        const user = await this.repository.findByUsernameWithPassword(input.username)

        if (!user) {
            throw new AppError('Invalid credentials', 401)
        }

        const isValid = await verifyPassword(input.password, user.passwordHash)

        if (!isValid) {
            throw new AppError('Invalid credentials', 401)
        }

        const token = this.signToken({
            sub: user.id,
            username: user.username,
            role: toDomainRole(user.role),
        })

        const userWithoutPassword: any = { ...user }
        delete userWithoutPassword.passwordHash

        return { 
            token, 
            user: userWithoutPassword 
        }
    }

    async getCurrentUser(id: string) {
        const user = await this.repository.findById(id)
        if (!user) return null
        
        return user
    }
}
