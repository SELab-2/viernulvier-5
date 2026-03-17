import { AppError } from '../../errors/app-error.js'
import { hashPassword } from '../../utils/password.js'
import { EditorsRepository } from './editors.repository.js'
import type { CreateEditorInput, UpdateEditorInput } from './editors.schema.js'

export class EditorsService {
    constructor(private readonly repository: EditorsRepository) { }

    async listEditors() {
        return this.repository.listEditors()
    }

    async createEditor(input: CreateEditorInput) {
        const existingUser = await this.repository.findByUsername(input.username)

        if (existingUser) {
            throw new AppError('Username already exists', 409)
        }

        const passwordHash = await hashPassword(input.password)

        return this.repository.createEditor({
            username: input.username,
            passwordHash,
        })
    }

    async updateEditor(id: string, input: UpdateEditorInput) {
        const existingEditor = await this.repository.findEditorById(id)

        if (!existingEditor) {
            throw new AppError('Editor not found', 404)
        }

        if (input.username && input.username !== existingEditor.username) {
            const userWithUsername = await this.repository.findByUsername(input.username)

            if (userWithUsername && userWithUsername.id !== id) {
                throw new AppError('Username already exists', 409)
            }
        }

        const passwordHash = input.password
            ? await hashPassword(input.password)
            : undefined

        return this.repository.updateEditor(id, {
            username: input.username,
            passwordHash,
        })
    }

    async deleteEditor(id: string) {
        const existingEditor = await this.repository.findEditorById(id)

        if (!existingEditor) {
            throw new AppError('Editor not found', 404)
        }

        await this.repository.deleteEditor(id)
    }
}
