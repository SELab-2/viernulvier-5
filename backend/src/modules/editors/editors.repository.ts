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

    async listEditors() {
        return this.prisma.adminUser.findMany({
            where: { role: Role.EDITOR },
            select: editorSelect,
            orderBy: { username: 'asc' },
        })
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
            where: { id },
            data,
            select: editorSelect,
        })
    }

    async deleteEditor(id: string) {
        return this.prisma.adminUser.delete({
            where: { id },
            select: editorSelect,
        })
    }
}
