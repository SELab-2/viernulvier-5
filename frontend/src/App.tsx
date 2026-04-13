import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { getMessages } from './i18n'

// Public pages
import HomePage from './pages/public/HomePage'
import ArchiveDetailPage from './pages/public/ArchiveDetailPage'
import BlogsPage from './pages/public/BlogsPage.tsx'
import BlogDetailPage from './pages/public/BlogDetailPage'

// Admin pages (lazy loaded — not included in public bundle)
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ArchiveEditPage = lazy(() => import('./pages/admin/ArchiveEditPage'))
const CreateBlogPage = lazy(() => import('./pages/admin/CreateBlogPage'))

/**
 * Root App component.
 *
 * Detects subdomain to switch between public and admin views.
 * - archief.viernulvier.be → public archive browser
 * - admin.archief.viernulvier.be → admin management panel
 * - localhost/127.0.0.1 → both available via /admin prefix
 */
function App() {
    const hostname = window.location.hostname
    const isAdmin = hostname.startsWith('admin.') || false
    const isLocalDevHost = hostname === 'localhost' || hostname === '127.0.0.1'
    const messages = getMessages()

    return (
        <Suspense fallback={<div>{messages.common.loading}</div>}>
            <Routes>
                {/* Public routes — always available */}
                <Route path="/" element={<HomePage />} />
                <Route path="/nl" element={<HomePage />} />
                <Route path="/en" element={<HomePage />} />
                <Route path="/zoeken" element={<HomePage />} />
                <Route path="/nl/zoeken" element={<HomePage />} />
                <Route path="/en/zoeken" element={<HomePage />} />
                <Route path="/archive/:id" element={<ArchiveDetailPage />} />
                <Route path="/nl/archive/:id" element={<ArchiveDetailPage />} />
                <Route path="/en/archive/:id" element={<ArchiveDetailPage />} />
                <Route path="/blogs" element={<BlogsPage />} />
                <Route path="/nl/blogs" element={<BlogsPage />} />
                <Route path="/en/blogs" element={<BlogsPage />} />
                <Route path="/blogs/:id" element={<BlogDetailPage />} />
                <Route path="/nl/blogs/:id" element={<BlogDetailPage />} />
                <Route path="/en/blogs/:id" element={<BlogDetailPage />} />

                {/* Admin routes — via subdomain or /admin prefix in development */}
                {(isAdmin || isLocalDevHost) && (
                    <>
                        <Route path="/admin/login" element={<LoginPage />} />
                        <Route path="/admin" element={<DashboardPage />} />
                        <Route path="/admin/archive/:id/edit" element={<ArchiveEditPage />} />
                        <Route path="/admin/blogs/create" element={<CreateBlogPage/>} />
                    </>
                )}
            </Routes>
        </Suspense>
    )
}

export default App
