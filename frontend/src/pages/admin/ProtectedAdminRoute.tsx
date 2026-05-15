import { Navigate, useLocation } from 'react-router-dom'
import { useAdminSession } from '../../auth/useAdminSession'
import { AdminSessionProvider } from '../../auth/AdminSessionContext'
import { trackNavigation } from '../../utils/navigationHistory'

import type { ReactElement } from 'react'
import { useEffect } from 'react'

type ProtectedAdminRouteProps = {
  children: ReactElement
  loginPath: string
}

type AdminEntryRouteProps = {
  loginPath: string
  dashboardPath: string
}

export function AdminEntryRoute({ loginPath, dashboardPath }: AdminEntryRouteProps) {
  const { isLoading, isAuthenticated } = useAdminSession()

  if (isLoading) {
    return null
  }

  return <Navigate to={isAuthenticated ? dashboardPath : loginPath} replace />
}

function ProtectedAdminRoute({ children, loginPath }: ProtectedAdminRouteProps) {
  const location = useLocation()
  const session = useAdminSession()

  // Track navigation history for all admin routes
  useEffect(() => {
    trackNavigation(location.pathname + location.search + location.hash)
  }, [location.pathname, location.search, location.hash])

  if (session.isLoading) {
    return null
  }

  if (!session.isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`

    return <Navigate to={loginPath} replace state={{ from }} />
  }

  return <AdminSessionProvider value={session}>{children}</AdminSessionProvider>
}

export default ProtectedAdminRoute
