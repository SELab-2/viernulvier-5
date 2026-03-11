import { describe, it, expect } from 'vitest'
import { Role } from '../../../src/domain/role.js'
import { Permission, hasPermission } from '../../../src/domain/permissions.js'

describe('Permissions', () => {
    it('ADMIN should have all archive permissions', () => {
        expect(hasPermission(Role.ADMIN, Permission.ARCHIVE_READ)).toBe(true)
        expect(hasPermission(Role.ADMIN, Permission.ARCHIVE_CREATE)).toBe(true)
        expect(hasPermission(Role.ADMIN, Permission.ARCHIVE_UPDATE)).toBe(true)
        expect(hasPermission(Role.ADMIN, Permission.ARCHIVE_DELETE)).toBe(true)
    })
})
