import { describe, it, expect, vi } from 'vitest'
import { AuthService } from '../../../src/modules/auth/auth.service.js'
import { AppError } from '../../../src/errors/app-error.js'
import { env } from '../../../src/config/env.js'

describe('AuthService', () => {
    const mockApp = {
        jwt: {
            sign: vi.fn().mockReturnValue('mock-token')
        }
    } as any

    const service = new AuthService(mockApp)

    it('should return a token for valid credentials', async () => {
        const result = await service.login({
            username: env.ADMIN_USERNAME,
            password: env.ADMIN_PASSWORD
        })

        expect(result).toEqual({ token: 'mock-token' })
        expect(mockApp.jwt.sign).toHaveBeenCalled()
    })

    it('should throw AppError for invalid credentials', async () => {
        await expect(service.login({
            username: 'wrong',
            password: 'wrong'
        })).rejects.toThrow(AppError)
    })
})
