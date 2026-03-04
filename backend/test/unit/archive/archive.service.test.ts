import { describe, it, expect } from 'vitest'
import { ArchiveRepository } from '../../../src/modules/archive/archive.repository.js'
import { ArchiveService } from '../../../src/modules/archive/archive.service.js'

/**
 * Scaffold test — demonstrates the testing pattern.
 *
 * Replace with real tests once domain logic is implemented.
 */
describe('ArchiveService', () => {
    it('should instantiate with a mocked repository', () => {
        const mockPrisma = {} as any
        const repository = new ArchiveRepository(mockPrisma)
        const service = new ArchiveService(repository)

        expect(service).toBeDefined()
    })
})
