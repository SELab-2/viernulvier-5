import type { PrismaClient } from '../../generated/prisma/client.js'

export class AuthRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findByUsername(username: string) {
        return this.prisma.adminUser.findUnique({
            where: { username },
        })
    }
}
