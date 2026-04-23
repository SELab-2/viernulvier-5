import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { getMessages } from './i18n'
import { getAdminRouteConfig } from './admin/paths'
import ProtectedAdminRoute, { AdminEntryRoute } from './pages/admin/ProtectedAdminRoute'


// Public pages
import HomePage from './pages/public/HomePage'
import ArchiveDetailPage from './pages/public/ArchiveDetailPage'
import SearchPage from './pages/public/SearchPage'

// Admin pages (lazy loaded — not included in public bundle)
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ArchiveEditPage = lazy(() => import('./pages/admin/ArchiveEditPage'))
const PostersPage = lazy(() => import('./pages/admin/PostersPage'))

import CreateBlogPage from './pages/admin/CreateBlogPage'
import BlogDetailPage from './pages/public/BlogDetailPage'
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
                        <Route path="/" element={<HomePage />} />
                        <Route path="/nl" element={<HomePage />} />
                        <Route path="/en" element={<HomePage />} />
                        <Route path="/zoeken" element={<SearchPage />} />
                        <Route path="/nl/zoeken" element={<SearchPage />} />
                        <Route path="/en/zoeken" element={<SearchPage />} />
                        <Route path="/archive/:id" element={<ArchiveDetailPage />} />
                        <Route path="/nl/archive/:id" element={<ArchiveDetailPage />} />
                        <Route path="/en/archive/:id" element={<ArchiveDetailPage />} />
                        
                        <Route path="/blogs/:id" element={<BlogDetailPage />} />
                        <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
                        <Route path="/en/blogs/:id" element={<BlogDetailPage />} />

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
                            path={adminRoutes.archiveEditPath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <ArchiveEditPage />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path={adminRoutes.postersPath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <PostersPage />
                                </ProtectedAdminRoute>
                            }
                        />

                        <Route path="/admin/blogs/create" element={<CreateBlogPage/>} />
                        <Route path="/en/admin/blogs/create" element={<CreateBlogPage/>} />
                        <Route path="/nl/admin/blogs/create" element={<CreateBlogPage/>} />

                        <Route path="/admin/blogs/:id/edit" element={<CreateBlogPage/>} />
                        <Route path="/en/admin/blogs/:id/edit" element={<CreateBlogPage/>} />
                        <Route path="/nl/admin/blogs/:id/edit" element={<CreateBlogPage/>} />
                    </>
                ) : null}
            </Routes>
        </Suspense>
    )
}

export default App
