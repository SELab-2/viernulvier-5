import { describe, expect, it } from 'vitest'
import { getAdminRouteConfig } from './paths'

describe('getAdminRouteConfig', () => {
  it('uses root-based admin paths on admin subdomains', () => {
    expect(getAdminRouteConfig('admin.archief.viernulvier.be')).toMatchObject({
      canRenderAdminRoutes: true,
      isAdminHost: true,
      isLocalDevHost: false,
      loginPath: '/',
      dashboardPath: '/dashboard',
    })
  })

  it('keeps /admin-prefixed paths on localhost', () => {
    expect(getAdminRouteConfig('localhost')).toMatchObject({
      canRenderAdminRoutes: true,
      isAdminHost: false,
      isLocalDevHost: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin',
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
