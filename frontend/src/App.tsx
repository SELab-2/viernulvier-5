import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { getMessages } from './i18n'
import { getAdminRouteConfig } from './admin/paths'
import ProtectedAdminRoute, { AdminEntryRoute } from './pages/admin/ProtectedAdminRoute'

// Public pages
import HomePage from './pages/public/HomePage'
import ArchiveDetailPage from './pages/public/ArchiveDetailPage'
<<<<<<< HEAD
import SearchPage from './pages/public/SearchPage'
=======
>>>>>>> c48b41e (name change Production -> Archive)

// Admin pages (lazy loaded — not included in public bundle)
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ArchiveEditPage = lazy(() => import('./pages/admin/ArchiveEditPage'))

/**
 * Root App component.
 *
 * Detects subdomain to switch between public and admin views.
 * - archief.viernulvier.be → public archive browser
 * - admin.archief.viernulvier.be → admin management panel
 * - localhost/127.0.0.1 → both available via /admin prefix
 */
function App() {
    const messages = getMessages()
    const adminRoutes = getAdminRouteConfig(window.location.hostname)

    return (
        <Suspense fallback={<div>{messages.common.loading}</div>}>
            <Routes>
                {!adminRoutes.isAdminHost ? (
                    <>
<<<<<<< HEAD
                        <Route path="/" element={<HomePage />} />
                        <Route path="/nl" element={<HomePage />} />
                        <Route path="/en" element={<HomePage />} />
                        <Route path="/zoeken" element={<SearchPage />} />
                        <Route path="/nl/zoeken" element={<SearchPage />} />
                        <Route path="/en/zoeken" element={<SearchPage />} />
                        <Route path="/archive/:id" element={<ArchiveDetailPage />} />
                        <Route path="/nl/archive/:id" element={<ArchiveDetailPage />} />
                        <Route path="/en/archive/:id" element={<ArchiveDetailPage />} />
=======
                        <Route path="/admin/login" element={<LoginPage />} />
                        <Route path="/admin" element={<DashboardPage />} />
<<<<<<< HEAD
                        <Route path="/admin/archive/:id/edit" element={<ArchiveEditPage />} />
<<<<<<< HEAD
                        <Route path="/admin/production/new" element={<ProductionEditPage create/>} />
                        <Route path="/en/admin/production/new" element={<ProductionEditPage create/>} />
                        <Route path="/nl/admin/production/new" element={<ProductionEditPage create/>} />
                        <Route path="/admin/production/:id/edit" element={<ProductionEditPage />} />
                        <Route path="/en/admin/production/:id/edit" element={<ProductionEditPage />} />
                        <Route path="/nl/admin/production/:id/edit" element={<ProductionEditPage />} />
>>>>>>> 616bbee (separate creating and editing a productions)
=======
                        <Route path="/admin/productions/new" element={<ProductionEditPage create/>} />
                        <Route path="/en/admin/productions/new" element={<ProductionEditPage create/>} />
                        <Route path="/nl/admin/productions/new" element={<ProductionEditPage create/>} />
                        <Route path="/admin/productions/:id/edit" element={<ProductionEditPage />} />
                        <Route path="/en/admin/productions/:id/edit" element={<ProductionEditPage />} />
                        <Route path="/nl/admin/productions/:id/edit" element={<ProductionEditPage />} />
>>>>>>> 3d8778f (feat: publishing and drafting the contents of a production)
=======
>>>>>>> c48b41e (name change Production -> Archive)
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
                        <Route
                            path={adminRoutes.productionEditPath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <ArchiveEditPage create />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path={adminRoutes.productionCreatePath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <ArchiveEditPage />
                                </ProtectedAdminRoute>
                            }
                        />
                    </>
                ) : null}
            </Routes>
        </Suspense>
    )
}

export default App