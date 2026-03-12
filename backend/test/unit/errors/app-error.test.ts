import { describe, it, expect } from 'vitest'
import { AppError } from '../../../src/errors/app-error.js'

describe('AppError', () => {
    it('should create an error with a message and status code', () => {
        const error = new AppError('Test error', 400)
        expect(error.message).toBe('Test error')
        expect(error.statusCode).toBe(400)
        expect(error.name).toBe('AppError')
    })

    it('should default to status code 500', () => {
        const error = new AppError('Server error')
        expect(error.statusCode).toBe(500)
    })
})
