import { useParams } from 'react-router-dom'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import AdminLayout from '../../components/admin/AdminLayout'

/**
 * Admin page for editing an archive item.
 */
function ArchiveEditPage() {
    const { id } = useParams<{ id: string }>()
    const messages = useAdminMessages()
    const ae = messages.admin.archiveEdit

    return (
        <AdminLayout mainClassName="px-4 py-8 lg:px-8 lg:py-8" showSidebar>
            <section className="site-container max-w-4xl">
                <div className="admin-auth-card rounded-[1rem] bg-surface px-8 py-8 max-[640px]:px-5 max-[640px]:py-6">
                    <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">{ae.pageTitle}</h1>
                    <p className="mt-3 text-sm leading-6 text-muted">{ae.itemIdLabel} {id}</p>
                </div>
            </section>
        </AdminLayout>
    )
}

export default ArchiveEditPage
