import AdminLayout from '../../components/admin/AdminLayout'
import { getMessages } from '../../i18n'

/**
 * Admin dashboard — overview of archive management.
 */
function DashboardPage() {
    const messages = getMessages()

    return (
        <AdminLayout mainClassName="px-4 py-14">
            <section className="site-container">
                <div className="admin-auth-card rounded-[1rem] bg-surface px-8 py-8 max-[640px]:px-5 max-[640px]:py-6">
                    <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">{messages.auth.dashboardTitle}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                        {messages.auth.dashboardDescription}
                    </p>
                </div>
            </section>
        </AdminLayout>
    )
}

export default DashboardPage
