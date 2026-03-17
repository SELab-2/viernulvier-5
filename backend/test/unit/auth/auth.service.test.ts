import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from '../../../src/modules/auth/auth.service.js'
import { AppError } from '../../../src/errors/app-error.js'
import { hashPassword } from '../../../src/utils/password.js'

describe('AuthService', () => {
    const repository = {
        findByUsername: vi.fn(),
    }
    const signToken = vi.fn()

    let service: AuthService

    beforeEach(() => {
        vi.clearAllMocks()
        service = new AuthService(repository as any, signToken)
    })

    it('should return a token for valid credentials', async () => {
        const passwordHash = await hashPassword('correct-password')

        repository.findByUsername.mockResolvedValue({
            id: 'user-1',
            username: 'admin',
            passwordHash,
            role: 'ADMIN',
        })
        signToken.mockReturnValue('mock-token')

        const result = await service.login({
            username: 'admin',
            password: 'correct-password',
        })

        expect(result).toEqual({ 
            token: 'mock-token',
            user: {
                id: 'user-1',
                username: 'admin',
                role: 'ADMIN',
            }
        })
        expect(repository.findByUsername).toHaveBeenCalledWith('admin')
        expect(signToken).toHaveBeenCalledWith({
            sub: 'user-1',
            username: 'admin',
            role: 'ADMIN',
        })
    })

    it('should throw AppError for invalid credentials', async () => {
        repository.findByUsername.mockResolvedValue(null)

        await expect(service.login({
            username: 'wrong',
            password: 'wrong',
        })).rejects.toMatchObject({
            name: 'AppError',
            message: 'Invalid credentials',
            statusCode: 401,
        } satisfies Partial<AppError>)
    })
})
