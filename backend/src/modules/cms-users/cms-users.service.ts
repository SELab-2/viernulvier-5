import { AppError } from '../../errors/app-error.js'
import { hashPassword } from '../../utils/password.js'
import { CmsUsersRepository } from './cms-users.repository.js'
import type {
    CmsUserPaginationQuery,
    CmsUserResponse,
    CreateEditorInput,
    UpdateEditorInput
} from './cms-users.schema.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class CmsUsersService {
    constructor(private readonly repository: CmsUsersRepository) { }

    async getCmsUsers(options: CmsUserPaginationQuery): Promise<PaginatedResult<CmsUserResponse>> {
        const { page, limit, search, blogId, productionId} = options

        const total = await this.repository.countCmsUsers({ search, blogId, productionId })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.listCmsUsers({
            page: sanitizedPage,
            limit,
            search,
            blogId,
            productionId
        })

        return {
            items: items as CmsUserResponse[],
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getCmsUser(id: string): Promise<CmsUserResponse | null> {
        return this.repository.findCmsUserById(id) as Promise<CmsUserResponse | null>
    }

    async getEditors(options: CmsUserPaginationQuery): Promise<PaginatedResult<CmsUserResponse>> {
        const { page, limit, search, blogId, productionId } = options

        const total = await this.repository.countEditors({ search, blogId, productionId })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.listEditors({
            page: sanitizedPage,
            limit,
            search,
            blogId,
            productionId
        })

        return {
            items: items as CmsUserResponse[],
            total,
            page: sanitizedPage,
            limit,
            totalPages,
        }
    }

    async getEditor(id: string): Promise<CmsUserResponse | null> {
        return this.repository.findEditorById(id) as Promise<CmsUserResponse | null>
    }

    async createEditor(input: CreateEditorInput): Promise<CmsUserResponse> {
        const existingUser = await this.repository.findByUsername(input.username)

        if (existingUser) {
            throw new AppError('Username already exists', 409)
        }

        const passwordHash = await hashPassword(input.password)

        return this.repository.createEditor({
            username: input.username,
            passwordHash,
        }) as Promise<CmsUserResponse>
    }

    async updateEditor(id: string, input: UpdateEditorInput): Promise<CmsUserResponse> {
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

        const passwordHash = input.password ? await hashPassword(input.password) : undefined

        return this.repository.updateEditor(id, {
            username: input.username,
            passwordHash,
        }) as Promise<CmsUserResponse>
    }

    async deleteEditor(id: string, currentUserId?: string): Promise<void> {
        if (currentUserId === id) {
            throw new AppError('Cannot delete your own account', 400)
        }

        const existingEditor = await this.repository.findEditorById(id)

        if (!existingEditor) {
            throw new AppError('Editor not found', 404)
        }

        await this.repository.deleteEditor(id)
    }
}
