import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { getMessages } from './i18n'

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
    const hostname = window.location.hostname
    // TODO: for dev purposes isAdmin is true
    // const isAdmin = hostname.startsWith('admin.') || false
    const isAdmin = true
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

                {/* Admin routes — via subdomain or /admin prefix in development */}
                {(isAdmin || isLocalDevHost) && (
                    <>
                        <Route path="/admin/login" element={<LoginPage />} />
                        <Route path="/admin" element={<DashboardPage />} />
                        <Route path="/admin/archive/:id/edit" element={<ArchiveEditPage />} />
                        <Route path="/admin/production/new" element={<ProductionEditPage create/>} />
                        <Route path="/en/admin/production/new" element={<ProductionEditPage create/>} />
                        <Route path="/nl/admin/production/new" element={<ProductionEditPage create/>} />
                        <Route path="/admin/production/:id/edit" element={<ProductionEditPage />} />
                        <Route path="/en/admin/production/:id/edit" element={<ProductionEditPage />} />
                        <Route path="/nl/admin/production/:id/edit" element={<ProductionEditPage />} />
                    </>
                )}
            </Routes>
        </Suspense>
    )
}

export default App
