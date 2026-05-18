import { useState } from 'react'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import AdminLayout from '../../components/admin/AdminLayout'
import DraftsTab from '../../components/admin/drafts/DraftsTab'
import DraftsTable from '../../components/admin/drafts/DraftsTable'
import {useProductionDrafts} from "../../components/admin/hooks/useProductionDrafts.ts";
import {useBlogDrafts} from "../../components/admin/hooks/useBlogDrafts.ts";
import { useOptionalAdminSession } from '../../auth/useAdminSessionContext';

type TabKey = 'productions' | 'blogs'

function DraftsDashboardPageContent() {
    const messages = useAdminMessages()
    const d = messages.admin.drafts
    const session = useOptionalAdminSession()
    const currentUserId = session?.user?.id

    const [tab, setTab] = useState<TabKey>('productions')
    const [onlyCurrent, setOnlyCurrent] = useState(false)

    const [refetch, setRefetch] = useState(false)

    const productions = useProductionDrafts({
        page: 1,
        limit: 10,
        enabled: tab === 'productions',
        editorId: onlyCurrent ? currentUserId : undefined,
        refetch,
    })

    const blogs = useBlogDrafts({
        page: 1,
        limit: 10,
        enabled: tab === 'blogs',
        editorId: onlyCurrent ? currentUserId : undefined,
        refetch,
    })

    const { items, isLoading, error } = tab === 'productions' ? productions : blogs

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
            {error && (
                <div
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                </div>
            )}


            <div className="flex items-center justify-between">
                <DraftsTab tab={tab} setTab={setTab}/>
                <button
                    onClick={() => setOnlyCurrent((prev) => !prev)}
                    className={[
                        'rounded-lg px-4 py-2 text-sm font-medium transition',
                        onlyCurrent
                            ? 'bg-accent text-white'
                            : 'border border-[var(--color-admin-card-border)] bg-white text-slate-500 hover:bg-slate-50 dark:bg-[#111318] dark:text-slate-400 dark:hover:bg-slate-800',
                    ].join(' ')}
                >
                    {d.filterOnlyCurrent}
                </button>
            </div>
            {isLoading ? (
                <div
                    className="flex h-[200px] w-full flex-col items-center justify-center gap-4 rounded-[12px] border border-[var(--color-admin-card-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]">
                    <div
                        className="h-6 w-6 animate-spin rounded-full border-3 border-slate-200 border-t-accent dark:border-slate-700 dark:border-t-accent"/>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {d.loadingMessage}
                    </p>
                </div>
            ) : (
                <DraftsTable items={items} isLoading={isLoading} tab={tab} currentUserId={currentUserId}  onDeleted={() => setRefetch((prev) => !prev)}/>

            )}
        </section>
    )
}

function DraftsDashboardPage() {
    return (
        <AdminLayout mainClassName="px-4 py-8 lg:px-8 lg:py-8" userName="Artevelde stagiair" showSidebar>
            <DraftsDashboardPageContent/>
        </AdminLayout>
    )
}

export default DraftsDashboardPage