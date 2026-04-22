import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { getMessages } from './i18n'
import { getAdminRouteConfig } from './admin/paths'
import ProtectedAdminRoute, { AdminEntryRoute } from './pages/admin/ProtectedAdminRoute'

// Public pages
import HomePage from './pages/public/HomePage'
import ArchiveDetailPage from './pages/public/ArchiveDetailPage'
import ProductionEditPage from './pages/admin/ProductionEditPage'

// Admin pages (lazy loaded — not included in public bundle)
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ArchiveEditPage = lazy(() => import('./pages/admin/ProductionEditPage'))

/**
 * Root App component.
 *
 * Detects subdomain to switch between public and admin views.
 * - archief.viernulvier.be → public archive browser
 * - admin.archief.viernulvier.be → admin management panel
 * - localhost/127.0.0.1 → both available via /admin prefix
 */
function App() {
    // TODO: for dev purposes isAdmin is true
    const messages = getMessages()
    const adminRoutes = getAdminRouteConfig(window.location.hostname)

    return (
        <Suspense fallback={<div>{messages.common.loading}</div>}>
            <Routes>
                {!adminRoutes.isAdminHost ? (
                    <>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/nl" element={<HomePage />} />
                        <Route path="/en" element={<HomePage />} />
                        <Route path="/zoeken" element={<HomePage />} />
                        <Route path="/nl/zoeken" element={<HomePage />} />
                        <Route path="/en/zoeken" element={<HomePage />} />
                        <Route path="/archive/:id" element={<ArchiveDetailPage />} />
                        <Route path="/nl/archive/:id" element={<ArchiveDetailPage />} />
                        <Route path="/en/archive/:id" element={<ArchiveDetailPage />} />
                        <Route path="/admin/login" element={<LoginPage />} />
                        <Route path="/admin" element={<DashboardPage />} />
                        <Route path="/admin/archive/:id/edit" element={<ArchiveEditPage />} />
                        <Route path="/admin/productions/new" element={<ProductionEditPage create/>} />
                        <Route path="/en/admin/productions/new" element={<ProductionEditPage create/>} />
                        <Route path="/nl/admin/productions/new" element={<ProductionEditPage create/>} />
                        <Route path="/admin/productions/:id/edit" element={<ProductionEditPage />} />
                        <Route path="/en/admin/productions/:id/edit" element={<ProductionEditPage />} />
                        <Route path="/nl/admin/productions/:id/edit" element={<ProductionEditPage />} />
                    </>
                ) : null}

                {adminRoutes.canRenderAdminRoutes ? (
                    <>
                        <Route path={adminRoutes.loginPath} element={<LoginPage />} />
                        {adminRoutes.legacyDashboardPaths.map((path) => (
                            <Route
                                key={path}
                                path={path}
                                element={
                                    <AdminEntryRoute
                                        loginPath={adminRoutes.loginPath}
                                        dashboardPath={adminRoutes.dashboardPath}
                                    />
                                }
                            />
                        ))}
                        <Route
                            path={adminRoutes.dashboardPath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <DashboardPage />
                                </ProtectedAdminRoute>
                            }
                        />
                        {/* <Route
                            path={adminRoutes.productionEditPath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <ProductionEditPage create />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path={adminRoutes.productionCreatePath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <ProductionEditPage />
                                </ProtectedAdminRoute>
                            }
                        /> */}
                    </>
                ) : null}
            </Routes>
        </Suspense>
    )
}

export default App