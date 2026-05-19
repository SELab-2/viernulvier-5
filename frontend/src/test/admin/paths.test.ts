import { describe, expect, it } from 'vitest'
import { getAdminRouteConfig } from '../../admin/paths'

describe('getAdminRouteConfig', () => {
  it('uses /admin-prefixed paths on admin subdomains', () => {
    expect(getAdminRouteConfig('admin.example.test')).toMatchObject({
      canRenderAdminRoutes: true,
      isAdminHost: true,
      isLocalDevHost: false,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/', '/nl/admin', '/en/admin'],
    })
  })

  it('keeps /admin-prefixed paths on localhost with /admin as the dashboard entry alias', () => {
    expect(getAdminRouteConfig('localhost')).toMatchObject({
      canRenderAdminRoutes: true,
      isAdminHost: false,
      isLocalDevHost: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/', '/nl/admin', '/en/admin'],
    })
  })

  it('allows sel2-5.ugent.be to render admin routes without admin-host legacy routes', () => {
    expect(getAdminRouteConfig('sel2-5.ugent.be')).toMatchObject({
      canRenderAdminRoutes: true,
      isAdminHost: false,
      isLocalDevHost: false,
      loginPath: '/admin/login',
      dashboardPath: '/admin',
      legacyDashboardPaths: [],
    })
  })

  it('disables admin routes on public hosts', () => {
    expect(getAdminRouteConfig('example.test')).toMatchObject({
      canRenderAdminRoutes: false,
      isAdminHost: false,
      isLocalDevHost: false,
    })
  })

  it('builds public archive URLs for admin subdomains', () => {
    const config = getAdminRouteConfig('admin.example.test')

    expect(config.publicPath('/posters/poster-1')).toBe('https://example.test/posters/poster-1')
  })

  it('keeps public archive paths relative outside admin subdomains', () => {
    const config = getAdminRouteConfig('localhost')

    expect(config.publicPath('/posters/poster-1')).toBe('/posters/poster-1')
  })


  it('keeps public archive paths relative when admin host has no public counterpart', () => {
    const config = getAdminRouteConfig('admin.')

    expect(config.publicPath('/posters/poster-1')).toBe('/posters/poster-1')
  })

})
