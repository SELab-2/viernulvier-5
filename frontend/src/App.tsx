import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Public pages
import HomePage from './pages/public/HomePage'
import ArchiveDetailPage from './pages/public/ArchiveDetailPage'

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
 * - localhost → both available via /admin prefix
 */
function App() {
    const hostname = window.location.hostname
    const isAdmin = hostname.startsWith('admin.') || false

    return (
        <Suspense fallback={<div>Laden...</div>}>
            <Routes>
                {/* Public routes — always available */}
                <Route path="/" element={<HomePage />} />
                <Route path="/archive/:id" element={<ArchiveDetailPage />} />

                {/* Admin routes — via subdomain or /admin prefix in development */}
                {(isAdmin || hostname === 'localhost') && (
                    <>
                        <Route path="/admin/login" element={<LoginPage />} />
                        <Route path="/admin" element={<DashboardPage />} />
                        <Route path="/admin/archive/:id/edit" element={<ArchiveEditPage />} />
                    </>
                )}
            </Routes>
        </Suspense>
    )
}

export default App
