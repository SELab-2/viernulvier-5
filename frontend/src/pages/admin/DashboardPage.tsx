import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import AdminLayout from '../../components/admin/AdminLayout'
import { buildStatCards, pillClasses } from '../../components/admin/hooks/dashboardStatCards'
import { useDashboardFormatters } from '../../components/admin/hooks/useDashboardFormatters'
import { useDashboardSummary } from '../../components/admin/hooks/useDashboardSummary'
import { usePagination } from '../../components/admin/hooks/usePagination'
import { ProductionsTable } from '../../components/admin/AdminProductionsTable'
import {getAdminRouteConfig} from "../../admin/paths.ts";

const PAGE_SIZE_OPTIONS = [3, 6, 9, 12, 15, 18] as const
type FixedPageSize = (typeof PAGE_SIZE_OPTIONS)[number]
type PageSizeSetting = 'auto' | FixedPageSize
const DEFAULT_PAGE_SIZE_SETTING: PageSizeSetting = 'auto'
const PAGE_SIZE_STORAGE_KEY = 'admin:dashboard:pageSize'

const ROW_HEIGHT_PX = 72
const CHROME_HEIGHT_PX = 520
const MIN_AUTO_ROWS: FixedPageSize = 3
const MAX_AUTO_ROWS: FixedPageSize = 18

function readStoredPageSize(): PageSizeSetting {
  if (typeof window === 'undefined') {
    return DEFAULT_PAGE_SIZE_SETTING
  }

  const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY)
  if (raw === 'auto') {
    return 'auto'
  }

  const parsed = raw === null ? NaN : Number(raw)
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)
      ? (parsed as FixedPageSize)
      : DEFAULT_PAGE_SIZE_SETTING
}

function computeAutoPageSize(viewportHeightPx: number): FixedPageSize {
  const available = Math.max(0, viewportHeightPx - CHROME_HEIGHT_PX)
  const rawRows = Math.floor(available / ROW_HEIGHT_PX)
  const clamped = Math.min(MAX_AUTO_ROWS, Math.max(MIN_AUTO_ROWS, rawRows))

  let best: FixedPageSize = MIN_AUTO_ROWS
  for (const option of PAGE_SIZE_OPTIONS) {
    if (option <= clamped) {
      best = option
    }
  }
  return best
}

type DashboardPageContentProps = {
  onUserRoleChange: (nextUserRole: string | undefined) => void
}

function DashboardPageContent({ onUserRoleChange }: DashboardPageContentProps) {
  const navigate = useNavigate()
  const {archiveEditPath} = getAdminRouteConfig(window.location.hostname)
  const messages = useAdminMessages()
  const d = messages.admin.dashboard
  const [pageSizeSetting, setPageSizeSetting] = useState<PageSizeSetting>(readStoredPageSize)
  const [autoSize, setAutoSize] = useState<FixedPageSize>(() =>
    typeof window === 'undefined' ? MIN_AUTO_ROWS : computeAutoPageSize(window.innerHeight),
  )
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (pageSizeSetting !== 'auto' || typeof window === 'undefined') {
      return
    }

    const onResize = () => setAutoSize(computeAutoPageSize(window.innerHeight))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [pageSizeSetting])

  const pageSize: FixedPageSize = pageSizeSetting === 'auto' ? autoSize : pageSizeSetting

  const handlePageSizeChange = (nextSetting: PageSizeSetting) => {
    setPageSizeSetting(nextSetting)
    setPage(1)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(nextSetting))
    }
  }

  const { summary, isLoading, error } = useDashboardSummary({ page, limit: pageSize })

  useEffect(() => {
    onUserRoleChange(summary ? d.editorsActive(summary.counts.editors) : undefined)
  }, [d, onUserRoleChange, summary])

  const { formatCount, formatDate, formatDelta } = useDashboardFormatters()
  const stats = buildStatCards(summary, {
    formatCount,
    formatDate,
    formatDelta,
    pillClasses,
    messages: d,
  })

  const recentItems = summary?.recentItems ?? []
  const total = summary?.totalRecentItems ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const { items: paginationItems, from, to } = usePagination({
    page,
    totalPages,
    siblings: 1,
    pageSize,
    totalItems: total,
  })

  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6 xl:max-w-[1280px] 2xl:max-w-[1536px]">
      <header className="space-y-1">
        <h1 className="text-[2rem] leading-9 font-normal tracking-[-0.05em] text-[#0f172a] dark:text-white">
          {d.pageTitle}
        </h1>
        <p className="text-base leading-6 text-[#475569] dark:text-slate-300">
          {d.pageSubtitle}
        </p>
        <p className="text-sm leading-5 text-[#94a3b8] dark:text-slate-400">
          {d.pageNote}
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-[var(--color-admin-card-border)] bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318] dark:text-slate-300">
          {d.loadingMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => (
          <article
            key={card.label}
            className="rounded-[12px] border border-[var(--color-admin-card-border)] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-[#475569] dark:text-slate-400">{card.label}</p>
                <p className="truncate text-xl leading-7 font-bold text-[#0f172a] tabular-nums sm:text-2xl sm:leading-8 dark:text-white">{isLoading ? '...' : card.value}</p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.accent}`}>
                <img src={card.iconSrc} alt={card.iconAlt} className="h-5 w-5 shrink-0" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${card.pill}`}>{card.change}</span>
              {card.note ? (
                <span className="text-xs text-[#94a3b8] dark:text-slate-400">{card.note}</span>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl leading-9 font-normal tracking-[-0.04em] text-[#0f172a] dark:text-white">{d.recentlyEdited}</h2>
        </div>

          <div className="overflow-hidden rounded-[12px] border border-[var(--color-admin-card-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]">
            <ProductionsTable
                items={recentItems}
                isLoading={isLoading}
                pageSize={pageSize}
                onEdit={(id) => navigate(archiveEditPath.replace(':id', id))}
            />
          </div>


        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {!isLoading && total > 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{d.paginationShowing(from, to, total)}</p>
            ) : null}

            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{d.pageSizeLabel}</span>
              <select
                value={pageSizeSetting}
                onChange={(event) => {
                  const raw = event.target.value
                  handlePageSizeChange(raw === 'auto' ? 'auto' : (Number(raw) as FixedPageSize))
                }}
                className="rounded-md border border-[var(--color-admin-card-border)] bg-white px-2 py-1 text-xs text-[#0f172a] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:bg-[#111318] dark:text-white dark:hover:bg-slate-800"
              >
                <option value="auto">
                  {pageSizeSetting === 'auto' ? `${d.pageSizeAuto} (${autoSize})` : d.pageSizeAuto}
                </option>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label={d.paginationPrev}
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
                  aria-label={String(item)}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => setPage(item)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm tabular-nums transition ${
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
              aria-label={d.paginationNext}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-admin-card-border)] bg-white text-sm text-[#475569] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#111318] dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </section>
  )
}

function DashboardPage() {
  const [userRole, setUserRole] = useState<string | undefined>(undefined)

  return (
    <AdminLayout mainClassName="px-4 py-8 lg:px-8 lg:py-8" userName="Artevelde stagiair" userRole={userRole} showSidebar>
      <DashboardPageContent onUserRoleChange={setUserRole} />
    </AdminLayout>
  )
}

export default DashboardPage
