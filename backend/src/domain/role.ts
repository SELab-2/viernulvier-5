/**
 * User roles in the system.
 *
 * Currently only ADMIN is used for the simple login system.
 * This enum is designed to be extended when more roles are needed.
 */
export enum Role {
    ADMIN = 'ADMIN',
    EDITOR = 'EDITOR',
    // Future roles can be added here:
    // VIEWER = 'VIEWER',
}
