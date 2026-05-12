import { AppError } from '../../errors/app-error.js'
import { hashPassword } from '../../utils/password.js'
import { CmsUsersRepository } from './cms-users.repository.js'
import type {
    CmsUserPaginationQuery,
    CmsUserResponse,
    CreateCmsUserInput,
    UpdateCmsUserInput
} from './cms-users.schema.js'
import type { Role } from '../../domain/role.js'
import { PaginatedResult, calculateTotalPages, sanitizePage } from '../../utils/pagination.js'

export class CmsUsersService {
    constructor(private readonly repository: CmsUsersRepository) { }

    async getCmsUsers(options: CmsUserPaginationQuery): Promise<PaginatedResult<CmsUserResponse>> {
        const { page, limit, search } = options

        const total = await this.repository.countCmsUsers({ search })
        const totalPages = calculateTotalPages(total, limit)
        const sanitizedPage = sanitizePage(page, totalPages)

        const items = await this.repository.listCmsUsers({
            page: sanitizedPage,
            limit,
            search
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

    async createCmsUser(input: CreateCmsUserInput): Promise<CmsUserResponse> {
        const existingUser = await this.repository.findByUsername(input.username)

        if (existingUser) {
            throw new AppError('Username already exists', 409)
        }

        const passwordHash = await hashPassword(input.password)

        return this.repository.createCmsUser({
            username: input.username,
            passwordHash,
            role: input.role as Role,
        }) as Promise<CmsUserResponse>
    }

    async updateCmsUser(id: string, input: UpdateCmsUserInput): Promise<CmsUserResponse> {
        const existingUser = await this.repository.findCmsUserById(id)

        if (!existingUser) {
            throw new AppError('CMS user not found', 404)
        }

        if (input.username && input.username !== existingUser.username) {
            const userWithUsername = await this.repository.findByUsername(input.username)

            if (userWithUsername && userWithUsername.id !== id) {
                throw new AppError('Username already exists', 409)
            }
        }

        const passwordHash = input.password ? await hashPassword(input.password) : undefined

        return this.repository.updateCmsUser(id, {
            username: input.username,
            passwordHash,
            role: input.role as Role | undefined,
        }) as Promise<CmsUserResponse>
    }

    async deleteCmsUser(id: string, currentUserId?: string): Promise<void> {
        if (currentUserId === id) {
            throw new AppError('Cannot delete your own account', 400)
        }

        const existingUser = await this.repository.findCmsUserById(id)

        if (!existingUser) {
            throw new AppError('CMS user not found', 404)
        }

        await this.repository.deleteCmsUser(id)
    }
}
