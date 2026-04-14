import { Navigate, useLocation } from 'react-router-dom'
import { useAdminSession } from '../../auth/useAdminSession'

import type { ReactElement } from 'react'

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
  const { isLoading, isAuthenticated } = useAdminSession()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`

    return <Navigate to={loginPath} replace state={{ from }} />
  }

  return children
}

export default ProtectedAdminRoute
