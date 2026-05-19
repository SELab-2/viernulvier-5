import { useState } from 'react'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import AdminLayout from '../../components/admin/AdminLayout'
import DraftsTab from '../../components/admin/drafts/DraftsTab'
import DraftsTable from '../../components/admin/drafts/DraftsTable'
import { useProductionDrafts } from "../../components/admin/hooks/useProductionDrafts.ts"
import { useBlogDrafts } from "../../components/admin/hooks/useBlogDrafts.ts"
import { useOptionalAdminSession } from '../../auth/useAdminSessionContext'

type TabKey = 'productions' | 'blogs'

const PAGE_SIZE_OPTIONS = [3, 6, 9, 12, 15, 18] as const
type FixedPageSize = (typeof PAGE_SIZE_OPTIONS)[number]
const DEFAULT_PAGE_SIZE: FixedPageSize = 6
const PAGE_SIZE_STORAGE_KEY = 'admin:drafts:pageSize'

function readStoredPageSize(): FixedPageSize {
    if (typeof window === 'undefined') return DEFAULT_PAGE_SIZE
    const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY)
    const parsed = raw === null ? NaN : Number(raw)
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)
        ? (parsed as FixedPageSize)
        : DEFAULT_PAGE_SIZE
}

function DraftsDashboardPageContent() {
    const messages = useAdminMessages()
    const d = messages.admin.drafts
    const session = useOptionalAdminSession()
    const currentUserId = session?.user?.id

    const [tab, setTab] = useState<TabKey>('productions')
    const [onlyCurrent, setOnlyCurrent] = useState(false)
    const [refetch, setRefetch] = useState(false)

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState<FixedPageSize>(readStoredPageSize)

    const handleTabChange = (next: TabKey) => {
        setTab(next)
        setPage(1)
    }

    const handlePageSizeChange = (next: FixedPageSize) => {
        setPageSize(next)
        setPage(1)
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(next))
        }
    }

    const productions = useProductionDrafts({
        page,
        limit: pageSize,
        enabled: tab === 'productions',
        editorId: onlyCurrent ? currentUserId : undefined,
        refetch,
    })

    const blogs = useBlogDrafts({
        page,
        limit: pageSize,
        enabled: tab === 'blogs',
        editorId: onlyCurrent ? currentUserId : undefined,
        refetch,
    })

    const { items, isLoading, error, total } = tab === 'productions' ? productions : blogs

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
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between">
                <DraftsTab tab={tab} setTab={handleTabChange} />
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
                <div className="flex h-[200px] w-full flex-col items-center justify-center gap-4 rounded-[12px] border border-[var(--color-admin-card-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]">
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-slate-200 border-t-accent dark:border-slate-700 dark:border-t-accent" />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {d.loadingMessage}
                    </p>
                </div>
            ) : (
                <DraftsTable
                    items={items}
                    isLoading={isLoading}
                    tab={tab}
                    currentUserId={currentUserId}
                    onDeleted={() => setRefetch((prev) => !prev)}
                    page={page}
                    pageSize={pageSize}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                    totalItems={total ?? 0}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                />
            )}
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