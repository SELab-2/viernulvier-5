export type AdminNavigationItem = {
    label: string
    to?: string
    disabled?: boolean
    iconSrc: string
    iconAlt: string
}

export type AdminNavigationGroup = {
    primary: AdminNavigationItem[]
    secondary: AdminNavigationItem[]
}

export function getAdminNavigationItems(): AdminNavigationGroup {
    return {
        primary: [
            { label: 'Dashboard', to: '/admin', iconSrc: '/admin/sidebar-dashboard.svg', iconAlt: 'Dashboard icoon' },
            { label: 'Producties', disabled: true, iconSrc: '/admin/sidebar-productions.svg', iconAlt: 'Producties icoon' },
            { label: 'Gallerij', disabled: true, iconSrc: '/admin/sidebar-gallery.svg', iconAlt: 'Gallerij icoon' },
            { label: 'Organisatie', disabled: true, iconSrc: '/admin/sidebar-organization.svg', iconAlt: 'Organisatie icoon' },
        ],
        secondary: [
            { label: 'Instellingen', disabled: true, iconSrc: '/admin/sidebar-settings.svg', iconAlt: 'Instellingen icoon' },
        ],
    }
}
