/**
 * User roles in the system.
 *
 * ADMIN can manage editor accounts.
 * EDITOR can manage archive content.
 */
export enum Role {
    ADMIN = 'ADMIN',
    EDITOR = 'EDITOR',
    // Future roles can be added here:
    // VIEWER = 'VIEWER',
}
