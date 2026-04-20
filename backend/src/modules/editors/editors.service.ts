import { AppError } from '../../errors/app-error.js'
import { hashPassword } from '../../utils/password.js'
import { EditorsRepository } from './editors.repository.js'
import type { 
    EditorPaginationQuery, 
    EditorResponse,
    CreateEditorInput, 
    UpdateEditorInput 
} from './editors.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class EditorsService {
    constructor(private readonly repository: EditorsRepository) { }

    async getEditors(options: EditorPaginationQuery): Promise<PaginatedResult<EditorResponse>> {
        const { page, limit, search } = options

        const total = await this.repository.countEditors({ search })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.listEditors({ 
            page: sanitizedPage, 
            limit, 
            search 
        })

        return {
            items: items as any,
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getEditor(id: string): Promise<EditorResponse | null> {
        return this.repository.findEditorById(id) as any
    }

    async createEditor(input: CreateEditorInput): Promise<EditorResponse> {
        const existingUser = await this.repository.findByUsername(input.username)

        if (existingUser) {
            throw new AppError('Username already exists', 409)
        }

        // HASH THE PASSWORD BEFORE SAVING
        const passwordHash = await hashPassword(input.password)

        return this.repository.createEditor({
            username: input.username,
            passwordHash,
        }) as any
    }

    async updateEditor(id: string, input: UpdateEditorInput): Promise<EditorResponse> {
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

        // ONLY HASH IF A NEW PASSWORD IS PROVIDED
        let passwordHash: string | undefined = undefined
        if (input.password) {
            passwordHash = await hashPassword(input.password)
        }

        return this.repository.updateEditor(id, {
            username: input.username,
            passwordHash,
        }) as any
    }

    async deleteEditor(id: string): Promise<void> {
        const existingEditor = await this.repository.findEditorById(id)

        if (!existingEditor) {
            throw new AppError('Editor not found', 404)
        }

        await this.repository.deleteEditor(id)
    }
}
