export type AdminNavItemId =
    | 'dashboard'
    | 'productions'
    | 'gallery'
    | 'organisation'
    | 'settings'

export type AdminNavigationItem = {
    id: AdminNavItemId
    to?: string
    disabled?: boolean
    iconSrc: string
}

export type AdminNavigationGroup = {
    primary: AdminNavigationItem[]
    secondary: AdminNavigationItem[]
}

export function getAdminNavigationItems(): AdminNavigationGroup {
    return {
        primary: [
            { id: 'dashboard', to: '/admin', iconSrc: '/admin/sidebar-dashboard.svg' },
            { id: 'productions', disabled: true, iconSrc: '/admin/sidebar-productions.svg' },
            { id: 'gallery', disabled: true, iconSrc: '/admin/sidebar-gallery.svg' },
            { id: 'organisation', disabled: true, iconSrc: '/admin/sidebar-organization.svg' },
        ],
        secondary: [
            { id: 'settings', disabled: true, iconSrc: '/admin/sidebar-settings.svg' },
        ],
    }
}
