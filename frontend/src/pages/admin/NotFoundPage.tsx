import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import { getAdminRouteConfig } from '../../admin/paths'

function NotFoundPageContent() {
  const navigate = useNavigate()
  const messages = useAdminMessages()
  const { dashboardPath } = getAdminRouteConfig(window.location.hostname)

  const handleGoToDashboard = () => {
    navigate(dashboardPath)
  }

  return (
    <section className="flex min-h-[70vh] w-full items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-normal leading-none tracking-[-0.04em] text-[#0f172a] sm:text-6xl md:text-7xl dark:text-white">
          <span>{messages.admin.notFound.titleTop}</span>{' '}
          <span className="text-accent">{messages.admin.notFound.titleAccent}</span>{' '}
          <span>{messages.admin.notFound.titleBottom}</span>
        </h1>

        <p className="text-base font-semibold text-accent md:text-lg">
          {messages.admin.notFound.joke}
        </p>

        <p className="whitespace-pre-line text-base text-[#475569] dark:text-slate-300">
          {messages.admin.notFound.description}
        </p>

        <button
          type="button"
          onClick={handleGoToDashboard}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {messages.admin.notFound.dashboardButton}
        </button>
      </div>
    </section>
  )
}

function NotFoundPage() {
  return (
    <AdminLayout showFooter showLogout={false}>
      <NotFoundPageContent />
    </AdminLayout>
  )
}

export default NotFoundPage
