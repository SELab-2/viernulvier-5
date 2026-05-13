import { useState } from 'react'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import AdminLayout from '../../components/admin/AdminLayout'
import DraftsTab from '../../components/admin/drafts/DraftsTab'
import DraftsTable from '../../components/admin/drafts/DraftsTable'
import {useProductionDrafts} from "../../components/admin/hooks/useProductionDrafts.ts";
import {useBlogDrafts} from "../../components/admin/hooks/useBlogsDrafts.ts";

type TabKey = 'productions' | 'blogs'

function DraftsDashboardPageContent() {
    const messages = useAdminMessages()
    const d = messages.admin.drafts

    const [tab, setTab] = useState<TabKey>('productions')

    const productions = useProductionDrafts({ page: 1, limit: 10 })
    const blogs = useBlogDrafts({ page: 1, limit: 10 })

    const { items, isLoading } = tab === 'productions' ? productions : blogs

    return (
        <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 xl:max-w-[1280px] 2xl:max-w-[1536px]">
            <header className="space-y-1">
                <h1 className="text-[2rem] leading-9 font-normal tracking-[-0.05em] text-[#0f172a] dark:text-white">
                    {d.pageTitle}
                </h1>
                <p className="text-base leading-6 text-[#475569] dark:text-slate-300">
                    {d.pageSubtitle}
                </p>
            </header>

            <DraftsTab tab={tab} setTab={setTab} />
            <DraftsTable items={items} isLoading={isLoading} />
        </section>
    )
}

function DraftsDashboardPage() {
    return (
        <AdminLayout mainClassName="px-4 py-8 lg:px-8 lg:py-8" userName="Artevelde stagiair" showSidebar>
            <DraftsDashboardPageContent />
        </AdminLayout>
    )
}

export default DraftsDashboardPage