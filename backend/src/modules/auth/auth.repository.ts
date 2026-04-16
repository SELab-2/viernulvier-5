import type { PrismaClient } from '@prisma/client'

const userSelect = {
    id: true,
    username: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} as const

export class AuthRepository {
    constructor(private readonly prisma: PrismaClient) { }

    /**
     * Finds a user by username, safely excluding sensitive data like passwordHash.
     */
    async findByUsername(username: string) {
        return this.prisma.adminUser.findUnique({
            where: { username },
            select: userSelect,
        })
    }

    /**
     * Specifically for authentication flows, returns the user including passwordHash.
     */
    async findByUsernameWithPassword(username: string) {
        return this.prisma.adminUser.findUnique({
            where: { username },
        })
    }

    /**
     * Finds a user by ID, safely excluding sensitive data.
     */
    async findById(id: string) {
        return this.prisma.adminUser.findUnique({
            where: { id },
            select: userSelect,
        })
    }
}
