import {Routes, Route, Navigate} from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { getAdminRouteConfig } from './admin/paths'
import ProtectedAdminRoute, { AdminEntryRoute } from './pages/admin/ProtectedAdminRoute'


// Public pages
import HomePage from './pages/public/HomePage'
import ArchiveDetailPage from './pages/public/ArchiveDetailPage'
import SearchPage from './pages/public/SearchPage'
import NotFoundPage from './pages/public/NotFoundPage'
import PosterDetailPage from './pages/public/PosterDetailPage'
// Eager: NotFound must render instantly for unknown routes (no Suspense flash).
import AdminNotFoundPage from './pages/admin/NotFoundPage'
import LoadingPage from './pages/LoadingPage'

// Admin pages (lazy loaded — not included in public bundle)
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ArchiveEditPage = lazy(() => import('./pages/admin/ArchiveEditPage'))
const PostersPage = lazy(() => import('./pages/admin/PostersPage'))
const CreateBlogPage = lazy(() => import('./pages/admin/CreateBlogPage'))

import BlogDetailPage from './pages/public/BlogDetailPage'
import BlogsPage from './pages/public/BlogsPage'
import DraftsDashboard from './pages/admin/DraftsDashboard.tsx'
/**
 * Root App component.
 *
 * Detects host capabilities and mounts admin routes under /admin.
 * - archief.viernulvier.be → public archive browser
 * - admin.archief.viernulvier.be → admin management panel via /admin
 * - localhost/127.0.0.1 → both available via /admin prefix
 */
function App() {
    const adminRoutes = getAdminRouteConfig(window.location.hostname)

    return (
        <Suspense fallback={<LoadingPage />}>
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
                        <Route path="/posters/:id" element={<PosterDetailPage />} />
                        <Route path="/nl/posters/:id" element={<PosterDetailPage />} />
                        <Route path="/en/posters/:id" element={<PosterDetailPage />} />
                        <Route path="/blogs" element={<BlogsPage />} />
                        <Route path="/nl/blogs" element={<BlogsPage />} />
                        <Route path="/en/blogs" element={<BlogsPage />} />
                        <Route path="/blogs/:id" element={<BlogDetailPage />} />
                        <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
                        <Route path="/en/blogs/:id" element={<BlogDetailPage />} />

                        <Route path="*" element={<NotFoundPage />} />
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
                            path={adminRoutes.draftsPath}
                            element={
                                <Navigate
                                    to={`${adminRoutes.draftsPath}/productions`}
                                    replace
                                />
                            }
                        />
                        <Route
                            path={`${adminRoutes.draftsPath}/:tab`}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <DraftsDashboard />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path={`/en${adminRoutes.draftsPath}`}
                            element={
                                <Navigate
                                    to={`/en${adminRoutes.draftsPath}/productions`}
                                    replace
                                />
                            }
                        />
                        <Route
                            path={`/en${adminRoutes.draftsPath}/:tab`}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <DraftsDashboard />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path={`/nl${adminRoutes.draftsPath}`}
                            element={
                                <Navigate
                                    to={`/nl${adminRoutes.draftsPath}/productions`}
                                    replace
                                />
                            }
                        />
                        <Route
                            path={`/nl${adminRoutes.draftsPath}/:tab`}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <DraftsDashboard />
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
                        <Route
                            path={adminRoutes.archivePreviewPath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <ArchiveDetailPage />
                                </ProtectedAdminRoute>
                            }
                        />

                        <Route
                            path={`/en${adminRoutes.archivePreviewPath}`}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <ArchiveDetailPage />
                                </ProtectedAdminRoute>
                            }
                        />

                        <Route
                            path={`/nl${adminRoutes.archivePreviewPath}`}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <ArchiveDetailPage />
                                </ProtectedAdminRoute>
                            }
                        />

                        <Route
                            path="/admin/blogs/create"
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <CreateBlogPage />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path="/en/admin/blogs/create"
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <CreateBlogPage />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path="/nl/admin/blogs/create"
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <CreateBlogPage />
                                </ProtectedAdminRoute>
                            }
                        />

                        <Route
                            path={adminRoutes.blogPreviewPath}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <BlogDetailPage />
                                </ProtectedAdminRoute>
                            }
                        />

                        <Route
                            path={`/en${adminRoutes.blogPreviewPath}`}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <BlogDetailPage />
                                </ProtectedAdminRoute>
                            }
                        />

                        <Route
                            path={`/nl${adminRoutes.blogPreviewPath}`}
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <BlogDetailPage />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path="/admin/blogs/:id/edit"
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <CreateBlogPage />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path="/en/admin/blogs/:id/edit"
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <CreateBlogPage />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route
                            path="/nl/admin/blogs/:id/edit"
                            element={
                                <ProtectedAdminRoute loginPath={adminRoutes.loginPath}>
                                    <CreateBlogPage />
                                </ProtectedAdminRoute>
                            }
                        />
                        <Route path="/admin/*" element={<AdminNotFoundPage />} />
                        {adminRoutes.isAdminHost ? (
                            <Route path="*" element={<AdminNotFoundPage />} />
                        ) : null}
                    </>
                ) : null}
            </Routes>
        </Suspense>
    )
}

export default App
