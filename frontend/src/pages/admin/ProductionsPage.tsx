import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import AdminLayout from '../../components/admin/AdminLayout'
import { usePagination } from '../../components/admin/hooks/usePagination'

// ─── Types — spiegelen exact de SearchPage API-types ─────────────────────────

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



type ProductionStatus = 'published' | 'concept'
type LanguageState = 'complete' | 'attention' | 'missing'

interface Production {
    id: string
    title: string
    thumbnailUrl?: string
    type: string
    status: ProductionStatus
    languageStatus: { nl: LanguageState; en: LanguageState }
    updatedAt: string
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
        thumbnailUrl: item.image_url ?? undefined,
        type: genre,
        status: item.status === 'published' ? 'published' : 'concept',
        languageStatus: {
            nl: mapLanguageState(item.language_status?.nl),
            en: mapLanguageState(item.language_status?.en),
        },
        updatedAt: item.updated_at,
    }
}


function StatusBadge({ status }: { status: ProductionStatus }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#059669]">
        <span className="h-2 w-2 rounded-full bg-[#10b981]" aria-hidden="true" />
        Gepubliceerd
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#d97706]">
      <span className="h-2 w-2 rounded-full bg-[#f59e0b]" aria-hidden="true" />
      Concept
    </span>
  )
}

function LanguageIndicator({
  languageStatus,
}: {
  languageStatus: { nl: LanguageState; en: LanguageState }
}) {
  const dotClass = (state: LanguageState) => {
    if (state === 'complete') return 'bg-[#10b981]'
    if (state === 'attention') return 'bg-[#f59e0b]'
    return 'bg-[#cbd5e1]'
  }

  const tooltip = (state: LanguageState) => {
    if (state === 'complete') return 'Volledig vertaald'
    if (state === 'attention') return 'Gedeeltelijk vertaald'
    return 'Ontbreekt'
  }

  return (
    <div className="flex gap-3 text-[9px] uppercase tracking-[0.08em] text-slate-500">
      {(['nl', 'en'] as const).map((loc) => {
        const state = languageStatus[loc]
        return (
          <span
            key={loc}
            className={`inline-block cursor-help rounded-sm focus:outline-none focus:ring-2 focus:ring-accent/40 ${state === 'missing' ? 'opacity-40' : ''}`}
            title={tooltip(state)}
            aria-label={`${loc.toUpperCase()}: ${tooltip(state)}`}
            tabIndex={0}
          >
            <span className="block">{loc}</span>
            <span
              aria-hidden="true"
              className={`mt-1 block h-2 w-2 rounded-full ${dotClass(state)}`}
            />
          </span>
        )
      })}
    </div>
  )
}

function Thumbnail({ title, url }: { title: string; url?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={title}
        className="h-10 w-10 shrink-0 rounded-md object-cover"
      />
    )
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-bold text-slate-500 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300">
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}



function ProductionsPageContent() {
  const navigate = useNavigate()

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

  // Debounce search query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query])

  // Reset page on tab change
  const handleTabChange = (next: TabFilter) => {
    setTab(next)
    setPage(1)
  }

  // Data ophalen
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
    if (!window.confirm('Weet je zeker dat je deze productie wilt verwijderen?')) return
    setDeletingId(id)
    try {
      await apiFetch(`/archive/productions/${id}`, { method: 'DELETE' })
      setReloadToken((t) => t + 1)
    } catch {
      setError('Verwijderen mislukt. Probeer opnieuw.')
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
    { key: 'all', label: `Alle${tab === 'all' && total > 0 ? ` (${total})` : ''}` },
    { key: 'published', label: 'Gepubliceerd' },
    { key: 'concept', label: 'Concepten' },
  ]

  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 xl:max-w-[1280px] 2xl:max-w-[1536px]">
      {/* ── Page header ── */}
      <header className="space-y-1">
        <h1 className="text-[2rem] leading-9 font-normal tracking-[-0.05em] text-[#0f172a] dark:text-white">
          Producties
        </h1>
        <p className="text-base leading-6 text-[#475569] dark:text-slate-300">
          Overzicht van alle gearchiveerde en actuele voorstellingen.
        </p>
      </header>

      {/* ── Error banner ── */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {/* ── Toolbar: search + new button ── */}
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
            placeholder="Zoek op titel, artiest of genre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-admin-card-border)] bg-white py-2 pl-9 pr-4 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:bg-[#111318] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <button
          onClick={() => navigate('/admin/productions/new')}
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
          Nieuwe Productie
        </button>
      </div>

      {/* ── Card with tabs + table ── */}
      <div className="overflow-hidden rounded-[12px] border border-[var(--color-admin-card-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]">

        {/* Tabs */}
        <div className="border-b border-[var(--color-admin-card-border)] px-6">
          <nav className="flex gap-6" role="tablist" aria-label="Producties filter">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse table-fixed">
            <thead className="bg-[rgba(248,250,252,0.7)] dark:bg-slate-900/60">
              <tr>
                {['Titel', 'Type', 'Status', 'Taal status', 'Laatst aangepast', 'Acties'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr
                      key={`skeleton-${i}`}
                      className="h-[72px] border-t border-slate-100 dark:border-slate-800"
                      aria-hidden="true"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                          <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-6 py-4" />
                      <td className="px-6 py-4">
                        <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      </td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))
                : null}

              {!isLoading && productions.length === 0 ? (
                <tr className="h-[72px]">
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    Geen producties gevonden.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? productions.map((production) => (
                    <tr
                      key={production.id}
                      className="h-[72px] border-t border-slate-100 transition-colors hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/30"
                    >
                      {/* Title */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Thumbnail title={production.title} url={production.thumbnailUrl} />
                          <span
                            className="block min-w-0 flex-1 truncate text-base text-[#0f172a] dark:text-white"
                            title={production.title}
                          >
                            {production.title}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-[#475569] dark:bg-slate-800 dark:text-slate-300">
                          {production.type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={production.status} />
                      </td>

                      {/* Language status */}
                      <td className="px-6 py-4">
                        <LanguageIndicator languageStatus={production.languageStatus} />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-[#475569] dark:text-slate-300">
                        {new Date(production.updatedAt).toLocaleDateString('nl-BE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button
                            aria-label={`Bewerk ${production.title}`}
                            onClick={() => navigate(`/admin/productions/${production.id}/edit`)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 3.487a2.25 2.25 0 0 1 3.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z"
                              />
                            </svg>
                          </button>
                          <button
                            aria-label={`Verwijder ${production.title}`}
                            disabled={deletingId === production.id}
                            onClick={() => void handleDelete(production.id)}                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          >
                            {deletingId === production.id ? (
                              <svg
                                className="h-4 w-4 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8H4z"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.75}
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}

              {/* Fill empty rows to keep table height stable */}
              {!isLoading && productions.length > 0 && productions.length < PAGE_SIZE
                ? Array.from({ length: PAGE_SIZE - productions.length }).map((_, i) => (
                    <tr
                      key={`placeholder-${i}`}
                      className="h-[72px] border-t border-slate-100 dark:border-slate-800"
                      aria-hidden="true"
                    >
                      <td colSpan={6} />
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isLoading && total > 0 ? (
          <p className="text-xs text-slate-500">
            Toont {from}–{to} van {total} resultaten
          </p>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <button
            aria-label="Vorige pagina"
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
                aria-label={`Pagina ${item}`}
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
            aria-label="Volgende pagina"
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
