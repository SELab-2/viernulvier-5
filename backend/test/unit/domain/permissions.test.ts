import { describe, it, expect } from 'vitest'
import { Role } from '../../../src/domain/role.js'
import { Permission, hasPermission } from '../../../src/domain/permissions.js'

describe('Permissions', () => {
    it('ADMIN should have all archive permissions', () => {
        expect(hasPermission(Role.ADMIN, Permission.ARCHIVE_READ)).toBe(true)
        expect(hasPermission(Role.ADMIN, Permission.ARCHIVE_CREATE)).toBe(true)
        expect(hasPermission(Role.ADMIN, Permission.ARCHIVE_UPDATE)).toBe(true)
        expect(hasPermission(Role.ADMIN, Permission.ARCHIVE_DELETE)).toBe(true)
        expect(hasPermission(Role.ADMIN, Permission.CMS_USERS_MANAGE)).toBe(true)
    })

    it('EDITOR should be able to fully manage archive items but not editor accounts', () => {
        expect(hasPermission(Role.EDITOR, Permission.ARCHIVE_READ)).toBe(true)
        expect(hasPermission(Role.EDITOR, Permission.ARCHIVE_CREATE)).toBe(true)
        expect(hasPermission(Role.EDITOR, Permission.ARCHIVE_UPDATE)).toBe(true)
        expect(hasPermission(Role.EDITOR, Permission.ARCHIVE_DELETE)).toBe(true)
        expect(hasPermission(Role.EDITOR, Permission.CMS_USERS_MANAGE)).toBe(false)
    })
})
