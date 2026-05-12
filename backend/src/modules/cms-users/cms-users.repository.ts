import type { PrismaClient } from '@prisma/client'
import type { Role } from '../../domain/role.js'

const cmsUserSelect = {
    id: true,
    username: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} as const

function buildCmsUserWhere(search?: string) {
    return search
        ? { username: { contains: search, mode: 'insensitive' as const } }
        : {}
}

export class CmsUsersRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async listCmsUsers(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        return this.prisma.adminUser.findMany({
            where: buildCmsUserWhere(search),
            select: cmsUserSelect,
            skip,
            take: limit,
            orderBy: { username: 'asc' },
        })
    }

    async countCmsUsers(options: { search?: string }) {
        return this.prisma.adminUser.count({ where: buildCmsUserWhere(options.search) })
    }

    async findCmsUserById(id: string) {
        return this.prisma.adminUser.findUnique({
            where: { id },
            select: cmsUserSelect,
        })
    }

    async findByUsername(username: string) {
        return this.prisma.adminUser.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                role: true,
            },
        })
    }

    async createCmsUser(data: { username: string, passwordHash: string, role: Role }) {
        return this.prisma.adminUser.create({
            data: {
                username: data.username,
                passwordHash: data.passwordHash,
                role: data.role,
            },
            select: cmsUserSelect,
        })
    }

    async updateCmsUser(id: string, data: { username?: string, passwordHash?: string, role?: Role }) {
        return this.prisma.adminUser.update({
            where: { id },
            data,
            select: cmsUserSelect,
        })
    }

    async deleteCmsUser(id: string) {
        return this.prisma.adminUser.delete({
            where: { id },
            select: cmsUserSelect,
        })
    }
}
