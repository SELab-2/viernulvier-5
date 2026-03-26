/**
 * Custom application error with HTTP status code.
 *
 * Throw this in services/controllers to automatically send
 * the correct HTTP error response through Fastify's error handler.
 */
export class AppError extends Error {
    public readonly statusCode: number

    constructor(message: string, statusCode: number = 500) {
        super(message)
        this.name = 'AppError'
        this.statusCode = statusCode
    }
}
