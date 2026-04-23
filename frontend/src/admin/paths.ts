export type AdminRouteConfig = {
  isAdminHost: boolean
  isLocalDevHost: boolean
  canRenderAdminRoutes: boolean
  loginPath: string
  dashboardPath: string
  legacyDashboardPaths: string[]
  productionsPath: string
  blogsPath: string
  archiveEditPath: string
  productionCreatePath: string
  blogEditPath: string
  blogCreatePath: string
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
      blogsPath: '/blogs',
      archiveEditPath: '/archive/:id/edit',
      productionCreatePath: '/productions/new',
      blogEditPath: '/blogs/:id/edit',
      blogCreatePath: '/blogs/create',
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
      blogsPath: '/admin/blogs',
      archiveEditPath: '/admin/archive/:id/edit',
      productionCreatePath: '/admin/productions/new',
      blogEditPath: '/admin/blogs/:id/edit',
      blogCreatePath: '/admin/blogs/create',
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
    blogsPath: '/admin/blogs',
    archiveEditPath: '/admin/archive/:id/edit',
    productionCreatePath: '/admin/productions/new',
    blogEditPath: '/admin/blogs/:id/edit',
    blogCreatePath: '/admin/blogs/create'
  }
}
