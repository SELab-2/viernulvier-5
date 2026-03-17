import type { PrismaClient } from '@prisma/client'

export class AuthRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findByUsername(username: string) {
        return this.prisma.adminUser.findUnique({
            where: { username },
        })
    }
}
