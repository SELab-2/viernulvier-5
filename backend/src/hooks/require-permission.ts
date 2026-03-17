import type { FastifyReply, FastifyRequest } from 'fastify'
import { hasPermission, type Permission } from '../domain/permissions.js'
import type { Role } from '../domain/role.js'

async function verifyAuthenticatedRequest(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify()
        return true
    } catch {
        await reply.status(401).send({ error: 'Authentication required' })
        return false
    }
}

export function requirePermission(permission: Permission) {
    return async function permissionGuard(request: FastifyRequest, reply: FastifyReply) {
        const isAuthenticated = await verifyAuthenticatedRequest(request, reply)

        if (!isAuthenticated) {
            return
        }

        const role = request.user.role as Role

        if (!hasPermission(role, permission)) {
            await reply.status(403).send({ error: 'Forbidden' })
        }
    }
}
