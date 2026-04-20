import { logoutAdmin } from '../api/adminAuth'
import { getAdminRouteConfig } from '../admin/paths'
import { clearPrimedAdminSession } from './primedAdminSession'

export async function logoutAndRedirect(hostname: string | undefined): Promise<void> {
  try {
    await logoutAdmin()
  } catch {
    // Keep logout UX consistent even if the API call fails.
  } finally {
    clearPrimedAdminSession()
    window.location.assign(getAdminRouteConfig(hostname ?? window.location.hostname).loginPath)
  }
}
