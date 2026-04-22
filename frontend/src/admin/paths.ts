export type AdminRouteConfig = {
  isAdminHost: boolean
  isLocalDevHost: boolean
  canRenderAdminRoutes: boolean
  loginPath: string
  dashboardPath: string
  legacyDashboardPaths: string[]
  productionsPath: string
  archiveEditPath: string
}

export function getAdminRouteConfig(hostname: string): AdminRouteConfig {
  const normalizedHostname = hostname.trim().toLowerCase()
  const isAdminHost = normalizedHostname.startsWith('admin.')
  const isLocalDevHost = normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1'

  if (isAdminHost) {
    return {
      isAdminHost,
      isLocalDevHost,
      canRenderAdminRoutes: true,
      loginPath: '/login',
      dashboardPath: '/dashboard',
      legacyDashboardPaths: ['/'],
      productionsPath: '/productions',
      archiveEditPath: '/archive/:id/edit',
    }
  }

  if (isLocalDevHost) {
    return {
      isAdminHost,
      isLocalDevHost,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin'],
      productionsPath: '/admin/productions',
      archiveEditPath: '/admin/archive/:id/edit',
    }
  }

  return {
    isAdminHost,
    isLocalDevHost,
    canRenderAdminRoutes: false,
    loginPath: '/admin/login',
    dashboardPath: '/admin',
    legacyDashboardPaths: [],
    productionsPath: '/admin/productions',
    archiveEditPath: '/admin/archive/:id/edit',
  }
}
