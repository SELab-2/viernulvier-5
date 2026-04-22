import type { PrismaClient } from '@prisma/client'
import { BlogsRepository } from '../blogs/blogs.repository.js'
import { ProductionsRepository } from '../productions/productions.repository.js'

export class SearchRepository {
    readonly blogsRepo: BlogsRepository
    readonly productionsRepo: ProductionsRepository

    constructor(prisma: PrismaClient) {
        this.blogsRepo = new BlogsRepository(prisma)
        this.productionsRepo = new ProductionsRepository(prisma)
    }
}
