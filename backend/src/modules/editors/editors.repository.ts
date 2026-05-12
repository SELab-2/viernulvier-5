import type { PrismaClient } from '@prisma/client'
import { Role } from '../../domain/role.js'

const editorSelect = {
    id: true,
    username: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} as const

export class EditorsRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async listEditors(options: { page: number; limit: number; search?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit

        const where: any = { role: Role.EDITOR }
        if (search) {
            where.username = { contains: search, mode: 'insensitive' }
        }

        return this.prisma.adminUser.findMany({
            where,
            select: editorSelect,
            skip,
            take: limit,
            orderBy: { username: 'asc' },
        })
    }

    async countEditors(options: { search?: string }) {
        const { search } = options
        const where: any = { role: Role.EDITOR }
        if (search) {
            where.username = { contains: search, mode: 'insensitive' }
        }

        return this.prisma.adminUser.count({ where })
    }

    async findEditorById(id: string) {
        return this.prisma.adminUser.findFirst({
            where: {
                id,
                role: Role.EDITOR,
            },
            select: editorSelect,
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
            select: editorSelect,
        })
    }

    async updateEditor(id: string, data: { username?: string, passwordHash?: string }) {
        return this.prisma.adminUser.update({
            where: {
                id,
                role: Role.EDITOR,
            },
            data,
            select: editorSelect,
        })
    }

    async deleteEditor(id: string) {
        return this.prisma.adminUser.delete({
            where: {
                id,
                role: Role.EDITOR,
            },
            select: editorSelect,
        })
    }
}
