import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { AppError } from '../errors/app-error.js'

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.setErrorHandler((error, request, reply) => {
        // Log error for debugging (except in tests to keep output clean)
        if (process.env.NODE_ENV !== 'test') {
            request.log.error(error)
        }

        // Cast to any for easier property access, but we'll use type guards where possible
        const err = error as any

        // Handle Prisma errors
        // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference#connector-errors
        if (err.code === 'P2025') {
            return reply.status(404).send({
                statusCode: 404,
                error: 'Not Found',
                message: 'The requested resource was not found.'
            })
        }

        if (err.code === 'P2002') {
            return reply.status(409).send({
                statusCode: 409,
                error: 'Conflict',
                message: 'A resource with this value already exists.'
            })
        }

        if (err.code === 'P2003') {
            return reply.status(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: 'Foreign key constraint failed.'
            })
        }

        // Handle custom AppError
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                statusCode: error.statusCode,
                error: error.name,
                message: error.message
            })
        }

        // Handle Zod validation errors (if not already handled by fastify-type-provider-zod)
        if (err.validation) {
            return reply.status(400).send({
                statusCode: 400,
                error: 'Bad Request',
                message: err.message,
                details: err.validation
            })
        }

        // Default error
        const statusCode = (error as { statusCode?: number }).statusCode || 500
        const message = error instanceof Error ? error.message : 'An unexpected error occurred'
        
        return reply.status(statusCode).send({
            statusCode,
            error: statusCode === 500 ? 'Internal Server Error' : 'Error',
            message
        })
    })
}

export default fp(errorHandlerPlugin)
