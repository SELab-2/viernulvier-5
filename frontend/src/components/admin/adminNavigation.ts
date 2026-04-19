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

import { getAdminRouteConfig } from '../../admin/paths'
import type { Messages } from '../../i18n/types'

export type AdminNavigationGroup = {
    primary: AdminNavigationItem[]
    secondary: AdminNavigationItem[]
}

type AdminNavMessages = Messages['admin']['nav']

export function getNavLabel(id: AdminNavItemId, nav: AdminNavMessages): string {
    const labelMap: Record<AdminNavItemId, string> = {
        dashboard: nav.dashboard,
        productions: nav.productions,
        gallery: nav.gallery,
        organisation: nav.organisation,
        settings: nav.settings,
    }

    return labelMap[id]
}

export function getNavIconAlt(id: AdminNavItemId, nav: AdminNavMessages): string {
    const altMap: Record<AdminNavItemId, string> = {
        dashboard: nav.dashboardIconAlt,
        productions: nav.productionsIconAlt,
        gallery: nav.galleryIconAlt,
        organisation: nav.organisationIconAlt,
        settings: nav.settingsIconAlt,
    }

    return altMap[id]
}

export function getAdminNavigationItems(hostname: string = window.location.hostname): AdminNavigationGroup {
    const { dashboardPath } = getAdminRouteConfig(hostname)

    return {
        primary: [
            { id: 'dashboard', to: dashboardPath, iconSrc: '/admin/sidebar-dashboard.svg' },
            { id: 'productions', disabled: true, iconSrc: '/admin/sidebar-productions.svg' },
            { id: 'gallery', disabled: true, iconSrc: '/admin/sidebar-gallery.svg' },
            { id: 'organisation', disabled: true, iconSrc: '/admin/sidebar-organization.svg' },
        ],
        secondary: [
            { id: 'settings', disabled: true, iconSrc: '/admin/sidebar-settings.svg' },
        ],
    }
}
