import { useEffect, useState } from 'react'
import { apiFetch } from '../../api/client'
import AdminLayout from '../../components/admin/AdminLayout'
import { usePagination } from '../../components/admin/hooks/usePagination'
import {
    ProductionsTable,
    type ProductionRow as Production,
    type LanguageState
} from '../../components/admin/ProductionsTable.tsx'
import {useNavigate} from "react-router-dom";
import { getAdminRouteConfig } from '../../admin/paths'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'


type LocalizedText = {
    nl?: string
    en?: string
    fr?: string
} | null

type ProductionApiItem = {
    id: string
    title: LocalizedText
    image_url?: string | null
    production_genres?: string[]
    performer_type: string | null
    status?: string | null
    language_status?: { nl?: string; en?: string } | null
    updated_at: string
}

type PaginatedApiResponse<T> = {
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

type TabFilter = 'all' | 'published' | 'concept'

const PAGE_SIZE = 10

function getLocalizedTitle(text: LocalizedText): string {
    if (!text) return ''
    return (text.nl ?? text.en ?? text.fr ?? '').trim()
}

function mapLanguageState(value?: string | null): LanguageState {
    if (value === 'complete') return 'complete'
    if (value === 'attention') return 'attention'
    return 'missing'
}

function mapProductionApiItem(item: ProductionApiItem): Production {
    const genre = (item.production_genres ?? [])[0] ?? item.performer_type ?? ''
    return {
        id: item.id,
        title: getLocalizedTitle(item.title) || '(Zonder titel)',
        type: genre,
        status: item.status === 'published' ? 'published' : 'concept',
        languageStatus: {
            nl: mapLanguageState(item.language_status?.nl),
            en: mapLanguageState(item.language_status?.en),
        },
        updatedAt: item.updated_at,
    }
}


function ProductionsPageContent() {
    const navigate = useNavigate()
    const { archiveEditPath, productionCreatePath } = getAdminRouteConfig(window.location.hostname)
    const t = useAdminMessages()


    const [tab, setTab] = useState<TabFilter>('all')
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [page, setPage] = useState(1)

    const [productions, setProductions] = useState<Production[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [reloadToken, setReloadToken] = useState(0)

    // debounce search query
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(query)
            setPage(1)
        }, 250)
        return () => window.clearTimeout(timer)
    }, [query])

    // reset page on tab change
    const handleTabChange = (next: TabFilter) => {
        setTab(next)
        setPage(1)
    }

    // data ophalen
    useEffect(() => {
        const abortController = new AbortController()

        const load = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(PAGE_SIZE),
                })

                if (debouncedQuery) params.set('search', debouncedQuery)
                if (tab !== 'all') params.set('status', tab)

                const response = await apiFetch<PaginatedApiResponse<ProductionApiItem>>(
                    `/archive/productions?${params.toString()}`,
                    { signal: abortController.signal },
                )

                setProductions(response.data.map(mapProductionApiItem))
                setTotal(response.meta?.total ?? 0)
                setTotalPages(Math.max(1, response.meta?.totalPages ?? 1))
            } catch (err) {
                if (abortController.signal.aborted) return
                setError(err instanceof Error ? err.message : 'Onbekende fout')
                setProductions([])
                setTotal(0)
                setTotalPages(1)
            } finally {
                if (!abortController.signal.aborted) setIsLoading(false)
            }
        }

        void load()
        return () => abortController.abort()
    }, [page, tab, debouncedQuery, reloadToken])

    const handleDelete = async (id: string) => {
        if (!window.confirm(t.admin.productions.deleteConfirm)) return
        setDeletingId(id)
        try {
            await apiFetch(`/archive/productions/${id}`, { method: 'DELETE' })
            setReloadToken((t) => t + 1)
        } catch {
            setError(t.admin.productions.deleteError)
        } finally {
            setDeletingId(null)
        }
    }

    const { items: paginationItems, from, to } = usePagination({
        page,
        totalPages,
        siblings: 1,
        pageSize: PAGE_SIZE,
        totalItems: total,
    })

    const tabs: { key: TabFilter; label: string }[] = [
        { key: 'all', label: `${t.admin.productions.tabAll}${tab === 'all' && total > 0 ? ` (${total})` : ''}` },
        { key: 'published', label: t.admin.productions.tabPublished },
        { key: 'concept', label: t.admin.productions.tabConcepts },
    ]

    return (
        <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 xl:max-w-[1280px] 2xl:max-w-[1536px]">
            <header className="space-y-1">
                <h1 className="text-[2rem] leading-9 font-normal tracking-[-0.05em] text-[#0f172a] dark:text-white">
                    {t.admin.productions.pageTitle}
                </h1>
                <p className="text-base leading-6 text-[#475569] dark:text-slate-300">
                    {t.admin.productions.pageSubtitle}
                </p>
            </header>

            {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <svg
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                        />
                    </svg>
                    <input
                        type="search"
                        placeholder={t.admin.productions.searchPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-admin-card-border)] bg-white py-2 pl-9 pr-4 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:bg-[#111318] dark:text-white dark:placeholder:text-slate-500"
                    />
                </div>

                <button
                    onClick={() => navigate(productionCreatePath)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {t.admin.productions.newButton}
                </button>
            </div>


            <div className="overflow-hidden rounded-[12px] border border-[var(--color-admin-card-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]">

                <div className="border-b border-[var(--color-admin-card-border)] px-6">
                    <nav className="flex gap-6" role="tablist" aria-label={t.admin.productions.tabAriaLabel}>
                        {tabs.map(({ key, label }) => (
                            <button
                                key={key}
                                role="tab"
                                aria-selected={tab === key}
                                onClick={() => handleTabChange(key)}
                                className={`py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                                    tab === key
                                        ? 'border-b-2 border-accent text-accent'
                                        : 'text-[#475569] hover:text-[#0f172a] dark:text-slate-400 dark:hover:text-white'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                </div>

                <ProductionsTable
                    items={productions}
                    isLoading={isLoading}
                    pageSize={PAGE_SIZE}
                    onEdit={(id) => navigate(archiveEditPath.replace(':id', id))}
                    onDelete={(id) => void handleDelete(id)}
                    deletingId={deletingId}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                {!isLoading && total > 0 ? (
                    <p className="text-xs text-slate-500">
                        {t.admin.productions.paginationShowing(from, to, total)}
                    </p>
                ) : (
                    <span />
                )}

                <div className="flex items-center gap-2">
                    <button
                        aria-label={t.admin.dashboard.paginationPrev}
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-admin-card-border)] bg-white text-sm text-[#475569] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#111318] dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        ‹
                    </button>

                    {paginationItems.map((item, index) => {
                        if (item === 'ellipsis-left' || item === 'ellipsis-right') {
                            return (
                                <span
                                    key={`${item}-${index}`}
                                    aria-hidden="true"
                                    className="flex h-8 w-8 items-center justify-center text-sm text-slate-400 dark:text-slate-500"
                                >
                  …
                </span>
                            )
                        }
                        return (
                            <button
                                key={item}
                                aria-label={t.admin.productions.paginationPageLabel(item)}
                                aria-current={item === page ? 'page' : undefined}
                                onClick={() => setPage(item)}
                                className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                                    item === page
                                        ? 'border-accent bg-accent font-semibold text-white'
                                        : 'border-[var(--color-admin-card-border)] bg-white text-[#0f172a] hover:bg-slate-50 dark:bg-[#111318] dark:text-white dark:hover:bg-slate-800'
                                }`}
                            >
                                {item}
                            </button>
                        )
                    })}

                    <button
                        aria-label={t.admin.dashboard.paginationNext}
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-admin-card-border)] bg-white text-sm text-[#475569] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#111318] dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        ›
                    </button>
                </div>
            </div>
        </section>
    )
}

function ProductionsPage() {
    return (
        <AdminLayout
            mainClassName="px-4 py-8 lg:px-8 lg:py-8"
            userName="Artevelde stagiair"
            showSidebar
        >
            <ProductionsPageContent />
        </AdminLayout>
    )
}

export default ProductionsPage