import { describe, expect, it } from 'vitest'
import { getAdminRouteConfig } from '../../admin/paths'

describe('getAdminRouteConfig', () => {
  it('uses /admin-prefixed paths on admin subdomains', () => {
    expect(getAdminRouteConfig('admin.archief.viernulvier.be')).toMatchObject({
      canRenderAdminRoutes: true,
      isAdminHost: true,
      isLocalDevHost: false,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/'],
    })
  })

  it('keeps /admin-prefixed paths on localhost with /admin as the dashboard entry alias', () => {
    expect(getAdminRouteConfig('localhost')).toMatchObject({
      canRenderAdminRoutes: true,
      isAdminHost: false,
      isLocalDevHost: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/'],
    })
  })

  it('disables admin routes on public hosts', () => {
    expect(getAdminRouteConfig('archief.viernulvier.be')).toMatchObject({
      canRenderAdminRoutes: false,
      isAdminHost: false,
      isLocalDevHost: false,
    })
  })
})
