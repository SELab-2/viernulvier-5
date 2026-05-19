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
  archivePreviewPath: string
  blogPreviewPath: string
  productionCreatePath: string
  blogEditPath: string
  blogCreatePath: string
  postersPath: string
  publicPath: (path: string) => string
  draftsPath: string
}

export function getAdminRouteConfig(hostname: string): AdminRouteConfig {
  const normalizedHostname = hostname.trim().toLowerCase()
  const isAdminHost = normalizedHostname.startsWith('admin.')
  const isLocalDevHost = normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1'
  const isPublicAdminHost = normalizedHostname === 'sel2-5.ugent.be'
  const canRenderAdminRoutes = isAdminHost || isLocalDevHost || isPublicAdminHost
  const publicHostname = isAdminHost ? normalizedHostname.replace(/^admin\./, '') : normalizedHostname
  const publicPath = (path: string) => isAdminHost && publicHostname ? `https://${publicHostname}${path}` : path

  if (isAdminHost || isLocalDevHost) {
    return {
      isAdminHost,
      isLocalDevHost,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/', '/nl/admin', '/en/admin'],
      productionsPath: '/admin/productions',
      blogsPath: '/admin/blogs',
      archiveEditPath: '/admin/archive/:id/edit',
      archivePreviewPath: '/admin/archive/:id',
      blogPreviewPath: '/admin/blogs/:id',
      productionCreatePath: '/admin/archive/create',
      blogEditPath: '/admin/blogs/:id/edit',
      blogCreatePath: '/admin/blogs/create',
      postersPath: '/admin/posters',
      draftsPath: '/admin/drafts',
      publicPath,
    }
  }

  return {
    isAdminHost,
    isLocalDevHost,
    canRenderAdminRoutes,
    loginPath: '/admin/login',
    dashboardPath: '/admin',
    legacyDashboardPaths: [],
    productionsPath: '/admin/productions',
    blogsPath: '/admin/blogs',
    archiveEditPath: '/admin/archive/:id/edit',
    archivePreviewPath: '/admin/archive/:id',
    blogPreviewPath: '/admin/blogs/:id',
    productionCreatePath: '/admin/archive/create',
    blogEditPath: '/admin/blogs/:id/edit',
    blogCreatePath: '/admin/blogs/create',
    postersPath: '/admin/posters',
    draftsPath: '/admin',
    publicPath,
  }
}
