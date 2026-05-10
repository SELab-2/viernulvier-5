export type AdminRouteConfig = {
  isAdminHost: boolean
  isLocalDevHost: boolean
  canRenderAdminRoutes: boolean
  loginPath: string
  dashboardPath: string
  legacyDashboardPaths: string[]
  archiveEditPath: string
  productionEditPath: string
  productionCreatePath: string
}

export function getAdminRouteConfig(hostname: string): AdminRouteConfig {
  const normalizedHostname = hostname.trim().toLowerCase()
  const isAdminHost = normalizedHostname.startsWith('admin.')
  const isLocalDevHost = normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1'
  const isPublicAdminHost = normalizedHostname === 'sel2-5.ugent.be'
  const canRenderAdminRoutes = isAdminHost || isLocalDevHost || isPublicAdminHost

  if (isAdminHost) {
    return {
      isAdminHost,
      isLocalDevHost,
      canRenderAdminRoutes: true,
      loginPath: '/login',
      dashboardPath: '/dashboard',
      legacyDashboardPaths: ['/'],
      archiveEditPath: '/archive/:id/edit',
      productionEditPath: '/productions/:id/edit',
      productionCreatePath: '/productions/new'
    }
  }

  if (isLocalDevHost) {
    return {
      isAdminHost,
      isLocalDevHost,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/'],
      archiveEditPath: '/admin/archive/:id/edit',
      productionEditPath: '/admin/productions/:id/edit',
      productionCreatePath: '/admin/productions/new'
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
    productionEditPath: '/admin/productions/:id/edit',
    productionCreatePath: '/admin/productions/new'
  }
}
