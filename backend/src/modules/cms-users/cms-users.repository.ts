import type { PrismaClient } from '@prisma/client'
import { Role } from '../../domain/role.js'

const cmsUserSelect = {
    id: true,
    username: true,
    role: true,
    created_at: true,
    updated_at: true,
} as const

function buildCmsUserWhere(search?: string, blogId?: string, productionId?: string) {
    return {
        ...(search ? {username: {contains: search, mode: 'insensitive' as const}} : {}),
        ...(blogId ? {
            editor_blog: {
                some: {
                    blog_id: blogId,
                }
            }
        } : {}),
        ...(productionId ? {
            editor_production: {
                some: {
                    production_id: productionId,
                }
            }
        } : {}),
    }
}

function buildEditorWhere(search?: string, blog?: string, production?: string) {
    return {
        role: Role.EDITOR,
        ...buildCmsUserWhere(search, blog, production),
    }
}

export class CmsUsersRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async listCmsUsers(options: { page: number; limit: number; search?: string, blogId?: string, productionId?: string }) {
        const { page, limit, search, blogId, productionId } = options
        const skip = (page - 1) * limit


        return this.prisma.adminUser.findMany({
            where: buildCmsUserWhere(search, blogId, productionId),
            select: cmsUserSelect,
            skip,
            take: limit,
            orderBy: { username: 'asc' },
        })
    }

    async countCmsUsers(options: {
        search: string | undefined;
        productionId: string | undefined;
        blogId: string | undefined
    }) {
        return this.prisma.adminUser.count({
            where: buildCmsUserWhere(options.search, options.blogId, options.productionId)
        })
    }

    async findCmsUserById(id: string) {
        return this.prisma.adminUser.findUnique({
            where: { id },
            select: cmsUserSelect,
        })
    }

    async listEditors(options: { page: number; limit: number; search?: string; blogId?: string, productionId?: string }) {
        const { page, limit, search, blogId, productionId } = options
        const skip = (page - 1) * limit

        return this.prisma.adminUser.findMany({
            where: buildEditorWhere(search, blogId, productionId),
            select: cmsUserSelect,
            skip,
            take: limit,
            orderBy: { username: 'asc' },
        })
    }


    async countEditors(options: {search?: string; blogId?: string, productionId?: string }) {
        return this.prisma.adminUser.count({ where: buildEditorWhere(options.search, options.blogId, options.productionId) })
    }

    async findEditorById(id: string) {
        return this.prisma.adminUser.findFirst({
            where: {
                id,
                role: Role.EDITOR,
            },
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

    async createEditor(data: { username: string, passwordHash: string }) {
        return this.prisma.adminUser.create({
            data: {
                username: data.username,
                passwordHash: data.passwordHash,
                role: Role.EDITOR,
            },
            select: cmsUserSelect,
        })
    }

    async updateEditor(id: string, data: { username?: string, passwordHash?: string }) {
        return this.prisma.adminUser.update({
            where: {
                id,
                role: Role.EDITOR,
            },
            data,
            select: cmsUserSelect,
        })
    }

    async deleteEditor(id: string) {
        return this.prisma.adminUser.delete({
            where: {
                id,
                role: Role.EDITOR,
            },
            select: cmsUserSelect,
        })
    }
}
