import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import AdminLayout from '../../components/admin/AdminLayout'
import { usePagination } from '../../components/admin/hooks/usePagination'
import { BlogsTable, type BlogRow } from '../../components/admin/BlogsTable.tsx'
import { getAdminRouteConfig } from '../../admin/paths'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import type { LanguageState } from '../../components/admin/ProductionsTable.tsx'
import { getActiveLocale, withLocalePath } from '../../i18n'
import { localize } from '../../utils/localize'

type LocalizedText = {
    nl?: string
    en?: string
    fr?: string
} | null

type BlogApiItem = {
    id: string
    title?: LocalizedText
    productions: string[]
    created_at: string
    updated_at: string
}

function getLocalizedTitle(text: LocalizedText | undefined, locale: 'nl' | 'en'): string {
    return (localize(text, locale) ?? '').trim()
}

function getLanguageState(text: LocalizedText | undefined, locale: 'nl' | 'en'): LanguageState {
    const value = text?.[locale]
    if (typeof value === 'string' && value.trim().length > 0) return 'complete'
    return 'missing'
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

const PAGE_SIZE = 10

function mapBlogApiItem(item: BlogApiItem, locale: 'nl' | 'en'): BlogRow {
    return {
        id: item.id,
        title: getLocalizedTitle(item.title, locale) ,
        productionCount: item.productions?.length ?? 0,
        languageStatus: {
            nl: getLanguageState(item.title, 'nl'),
            en: getLanguageState(item.title, 'en'),
        },
        created_at: item.created_at,
        updated_at: item.updated_at,
        detailHref: withLocalePath(`/blogs/${item.id}`, locale),
    }
}

function BlogsPageContent() {
    const navigate = useNavigate()
    const { blogCreatePath, blogEditPath } = getAdminRouteConfig(window.location.hostname)
    const messages = useAdminMessages()
    const b = messages.admin.blogsPage
    const d = messages.admin.dashboard
    const locale = getActiveLocale(window.location.pathname)
    const paginationPrevLabel = d.paginationPrev
    const paginationNextLabel = d.paginationNext

    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [page, setPage] = useState(1)

    const [blogs, setBlogs] = useState<BlogRow[]>([])
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [reloadToken, setReloadToken] = useState(0)

    // debounce zoekterm
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(query)
            setPage(1)
        }, 250)
        return () => window.clearTimeout(timer)
    }, [query])

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

                const response = await apiFetch<PaginatedApiResponse<BlogApiItem>>(
                    `/archive/blogs?${params.toString()}`,
                    { signal: abortController.signal },
                )

                setBlogs(response.data.map((item) => mapBlogApiItem(item, locale)))
                setTotal(response.meta?.total ?? 0)
                setTotalPages(Math.max(1, response.meta?.totalPages ?? 1))
            } catch (err) {
                if (abortController.signal.aborted) return
                setError(err instanceof Error ? err.message : b.loadError)
                setBlogs([])
                setTotal(0)
                setTotalPages(1)
            } finally {
                if (!abortController.signal.aborted) setIsLoading(false)
            }
        }

        void load()
        return () => abortController.abort()
    }, [page, debouncedQuery, reloadToken, locale, b.loadError])

    const handleDelete = async (id: string) => {
        const deleteConfirmMessage = messages.blogs.deleteConfirm
        if (!window.confirm(deleteConfirmMessage)) return
        setDeletingId(id)
        try {
            await apiFetch(`/archive/blogs/${id}`, { method: 'DELETE' })
            setReloadToken((t) => t + 1)
        } catch {
            setError(b.deleteError)
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

    return (
        <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 xl:max-w-[1280px] 2xl:max-w-[1536px]">
            <header className="space-y-1">
                <h1 className="text-[2rem] leading-9 font-normal tracking-[-0.05em] text-[#0f172a] dark:text-white">
                    {b.pageTitle}
                </h1>
                <p className="text-base leading-6 text-[#475569] dark:text-slate-300">
                    {b.pageSubtitle}
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
                        placeholder={b.searchPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-admin-card-border)] bg-white py-2 pl-9 pr-4 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:bg-[#111318] dark:text-white dark:placeholder:text-slate-500"
                    />
                </div>

                <button
                    onClick={() => navigate(blogCreatePath)}
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
                    {b.newButton}
                </button>
            </div>

            <div className="overflow-hidden rounded-[12px] border border-[var(--color-admin-card-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]">
                <BlogsTable
                    items={blogs}
                    isLoading={isLoading}
                    pageSize={PAGE_SIZE}
                    onEdit={(id) => navigate(blogEditPath.replace(':id', id))}
                    onDelete={(id) => void handleDelete(id)}
                    deletingId={deletingId}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                {!isLoading && total > 0 ? (
                    <p className="text-xs text-slate-500">
                        {b.paginationShowing(from, to, total)}
                    </p>
                ) : (
                    <span />
                )}

                <div className="flex items-center gap-2">
                    <button
                        aria-label={paginationPrevLabel}
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
                                aria-label={b.paginationPageLabel(item)}
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
                        aria-label={paginationNextLabel}
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

function BlogsPage() {
    return (
        <AdminLayout
            mainClassName="px-4 py-8 lg:px-8 lg:py-8"
            userName="Artevelde stagiair"
            showSidebar
        >
            <BlogsPageContent />
        </AdminLayout>
    )
}

export default BlogsPage