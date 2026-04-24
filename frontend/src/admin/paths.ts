export type AdminRouteConfig = {
  isAdminHost: boolean
  isLocalDevHost: boolean
  canRenderAdminRoutes: boolean
  loginPath: string
  dashboardPath: string
  legacyDashboardPaths: string[]
  archiveEditPath: string
  postersPath: string
}

export function getAdminRouteConfig(hostname: string): AdminRouteConfig {
  const normalizedHostname = hostname.trim().toLowerCase()
  const isAdminHost = normalizedHostname.startsWith('admin.')
  const isLocalDevHost = normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1'
  const canRenderAdminRoutes = isAdminHost || isLocalDevHost

  if (canRenderAdminRoutes) {
    return {
      isAdminHost,
      isLocalDevHost,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/'],
      archiveEditPath: '/admin/archive/:id/edit',
      postersPath: '/admin/posters',
    }
  }

  return {
    isAdminHost,
    isLocalDevHost,
    canRenderAdminRoutes: false,
    loginPath: '/admin/login',
    dashboardPath: '/admin',
    legacyDashboardPaths: [],
    archiveEditPath: '/admin/archive/:id/edit',
    postersPath: '/admin/posters',
  }
}
