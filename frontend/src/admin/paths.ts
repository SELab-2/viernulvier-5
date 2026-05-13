export type AdminRouteConfig = {
  isAdminHost: boolean
  isLocalDevHost: boolean
  canRenderAdminRoutes: boolean
  loginPath: string
  dashboardPath: string
  legacyDashboardPaths: string[]
  archiveEditPath: string,
  draftsPath: string,
}

export function getAdminRouteConfig(hostname: string): AdminRouteConfig {
  const normalizedHostname = hostname.trim().toLowerCase()
  const isAdminHost = normalizedHostname.startsWith('admin.')
  const isLocalDevHost = normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1'
  const isPublicAdminHost = normalizedHostname === 'sel2-5.ugent.be'
  const canRenderAdminRoutes = isAdminHost || isLocalDevHost || isPublicAdminHost

  if (isAdminHost || isLocalDevHost) {
    return {
      isAdminHost,
      isLocalDevHost,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/'],
      archiveEditPath: '/admin/archive/:id/edit',
      draftsPath: '/admin/drafts',
    }
  }

  return {
    isAdminHost,
    isLocalDevHost,
    canRenderAdminRoutes,
    loginPath: '/admin/login',
    dashboardPath: '/admin',
    legacyDashboardPaths: [],
    archiveEditPath: '/admin/archive/:id/edit',
    draftsPath: '/admin',
  }
}
