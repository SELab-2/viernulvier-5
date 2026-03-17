import { Role } from './role.js'

/**
 * Permission definitions per role.
 *
 * Maps roles to the actions they're allowed to perform.
 * Prepared for future fine-grained permission checks.
 */
export enum Permission {
    ARCHIVE_READ = 'archive:read',
    ARCHIVE_CREATE = 'archive:create',
    ARCHIVE_UPDATE = 'archive:update',
    ARCHIVE_DELETE = 'archive:delete',
    EDITORS_MANAGE = 'editors:manage',
}

export const rolePermissions: Record<Role, Permission[]> = {
    [Role.ADMIN]: [
        Permission.ARCHIVE_READ,
        Permission.ARCHIVE_CREATE,
        Permission.ARCHIVE_UPDATE,
        Permission.ARCHIVE_DELETE,
        Permission.EDITORS_MANAGE,
    ],
    [Role.EDITOR]: [
        Permission.ARCHIVE_READ,
        Permission.ARCHIVE_CREATE,
        Permission.ARCHIVE_UPDATE,
        Permission.ARCHIVE_DELETE,
    ],
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) ?? false
}
