import { useEffect, useState } from 'react'
import { useAdminMessages } from '../../components/admin/AdminMessagesContext'
import AdminLayout from '../../components/admin/AdminLayout'
import { useDashboardSummary } from '../../components/admin/useDashboardSummary'
import type { Locale } from '../../i18n/types'

const PAGE_SIZE = 3

type DeltaInfo = { changePct: number | null; direction: 'up' | 'down' | 'flat' }

function makeCountFormatter(locale: Locale): Intl.NumberFormat {
  return new Intl.NumberFormat(locale === 'nl' ? 'nl-BE' : 'en-GB')
}

function makeSignFormatter(locale: Locale): Intl.NumberFormat {
  return new Intl.NumberFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
    signDisplay: 'exceptZero',
    maximumFractionDigits: 0,
  })
}

function formatDeltaPill(delta: DeltaInfo | undefined, signFormatter: Intl.NumberFormat): string {
  if (!delta || delta.changePct === null) {
    return '—'
  }

  return signFormatter.format(delta.changePct) + '%'
}

function pillClasses(delta: DeltaInfo | undefined): string {
  const direction = delta?.direction ?? 'flat'

  if (direction === 'up') {
    return 'bg-[#ecfdf5] text-[#10b981]'
  }

  if (direction === 'down') {
    return 'bg-[#fef2f2] text-[#ef4444]'
  }

  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
}

function makeDateFormatter(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type DashboardPageContentProps = {
  onUserRoleChange: (nextUserRole: string | undefined) => void
}

function DashboardPageContent({ onUserRoleChange }: DashboardPageContentProps) {
  const messages = useAdminMessages()
  const d = messages.admin.dashboard
  const [page, setPage] = useState(1)

  const { summary, isLoading, error } = useDashboardSummary({ page, limit: PAGE_SIZE })

  useEffect(() => {
    onUserRoleChange(summary ? d.editorsActive(summary.counts.editors) : undefined)
  }, [d, onUserRoleChange, summary])

  const htmlLang = document.documentElement.lang as Locale | undefined
  const activeLocale: Locale = htmlLang === 'en' ? 'en' : 'nl'
  const countFormatter = makeCountFormatter(activeLocale)
  const dateFormatter = makeDateFormatter(activeLocale)
  const signFormatter = makeSignFormatter(activeLocale)

  function formatCount(value: number): string {
    return countFormatter.format(value)
  }

  function formatDate(value: string | null): string {
    if (!value) {
      return d.notSyncedYet
    }

    return dateFormatter.format(new Date(value))
  }

  const productionsDelta = summary?.deltas?.productions
  const blogsDelta = summary?.deltas?.blogs

  const stats = [
    {
      label: d.statProductions,
      value: summary ? formatCount(summary.counts.productions) : '—',
      change: formatDeltaPill(productionsDelta, signFormatter),
      note: productionsDelta?.changePct !== null && productionsDelta !== undefined ? d.deltaVsLastMonth : null,
      accent: 'bg-[rgba(236,19,55,0.1)] text-[#ec1337]',
      pill: pillClasses(productionsDelta),
      iconSrc: '/admin/dashboard/productions-icon.svg',
      iconAlt: d.statProductions,
    },
    {
      label: d.statBlogConcepts,
      value: summary ? formatCount(summary.counts.blogs) : '—',
      change: formatDeltaPill(blogsDelta, signFormatter),
      note: blogsDelta?.changePct !== null && blogsDelta !== undefined ? d.deltaVsLastMonth : null,
      accent: 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]',
      pill: pillClasses(blogsDelta),
      iconSrc: '/admin/dashboard/concepts-icon.svg',
      iconAlt: d.statBlogConcepts,
    },
    {
      label: d.statVisitors,
      value: d.visitorsPlaceholder,
      change: d.visitorsChange,
      note: d.visitorsNote,
      accent: 'bg-[rgba(59,130,246,0.1)] text-[#2563eb]',
      pill: 'bg-[rgba(59,130,246,0.08)] text-[#2563eb] dark:bg-blue-950/50 dark:text-blue-300',
      iconSrc: '/admin/dashboard/visitors-icon.svg',
      iconAlt: d.statVisitors,
    },
    {
      label: d.statMediaItems,
      value: summary ? formatCount(summary.counts.mediaItems) : '—',
      change: summary?.lastScrapedAt ? formatDate(summary.lastScrapedAt) : d.visitorsChange,
      note: summary?.lastScrapedAt ? d.statLastSync : d.statSyncPending,
      accent: 'bg-[rgba(168,85,247,0.1)] text-accent',
      pill: 'bg-[#ecfdf5] text-[#10b981] dark:bg-emerald-950/50 dark:text-emerald-300',
      iconSrc: '/admin/dashboard/media-icon.svg',
      iconAlt: d.statMediaItems,
    },
  ]

  const recentItems = summary?.recentItems ?? []
  const total = summary?.totalRecentItems ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const windowSize = Math.min(totalPages, 3)
  const windowStart = Math.min(
    Math.max(1, page - Math.floor(windowSize / 2)),
    Math.max(1, totalPages - windowSize + 1),
  )
  const visiblePages = Array.from({ length: windowSize }, (_, i) => windowStart + i)

  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
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
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#475569] dark:text-slate-400">{card.label}</p>
                <p className="text-2xl leading-8 font-bold text-[#0f172a] dark:text-white">{isLoading ? '...' : card.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.accent}`}>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] table-fixed border-collapse">
              <colgroup>
                <col />
                <col className="w-[140px]" />
                <col className="w-[200px]" />
                <col className="w-[120px]" />
                <col className="w-[140px]" />
                <col className="w-[120px]" />
              </colgroup>
              <thead className="bg-[rgba(248,250,252,0.7)] dark:bg-slate-900/60">
                <tr>
                  {[
                    d.tableColTitle,
                    d.tableColType,
                    d.tableColStatus,
                    d.tableColLanguage,
                    d.tableColDate,
                    d.tableColActions,
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-[var(--color-admin-card-border)] px-6 py-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#475569] dark:text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => (
                  <tr key={item.id} className="h-[72px] border-t border-slate-100 dark:border-slate-800">
                    <td className="w-[40%] max-w-0 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          {item.title.slice(0, 2).toUpperCase()}
                        </div>
                        <span
                          className="block min-w-0 flex-1 truncate text-base text-[#0f172a] dark:text-white"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-block whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs text-[#475569] dark:bg-slate-800 dark:text-[color:var(--color-text-muted)]">
                        {item.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-[#059669] dark:text-emerald-300">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
                        {d.statusAvailable}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-[9px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                        {(['nl', 'en'] as const).map((loc) => {
                          const state = item.languageStatus[loc]
                          const dotClass = state === 'complete'
                            ? 'bg-[#10b981]'
                            : state === 'attention'
                              ? 'bg-[#f59e0b]'
                              : 'bg-[#cbd5e1]'

                          return (
                            <div key={loc} className={state === 'missing' ? 'opacity-40' : ''}>
                              <div>{loc}</div>
                              <div className={`mt-1 h-2 w-2 rounded-full ${dotClass}`} />
                            </div>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#475569] dark:text-slate-300">{formatDate(item.updatedAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                          {d.actionView}
                        </button>
                        <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                          {d.actionEdit}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && recentItems.length === 0 ? (
                  <tr className="h-[72px]">
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      {d.emptyRecent}
                    </td>
                  </tr>
                ) : null}
                {!isLoading && recentItems.length > 0 && recentItems.length < PAGE_SIZE
                  ? Array.from({ length: PAGE_SIZE - recentItems.length }).map((_, i) => (
                      <tr key={`placeholder-${i}`} className="h-[72px] border-t border-slate-100 dark:border-slate-800" aria-hidden>
                        <td colSpan={6} />
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {!isLoading && total > 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{d.paginationShowing(from, to, total)}</p>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              aria-label={d.paginationPrev}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-admin-card-border)] bg-white text-sm text-[#475569] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#111318] dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ‹
            </button>

            {visiblePages.map((p) => (
              <button
                key={p}
                aria-label={String(p)}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                  p === page
                    ? 'border-accent bg-accent font-semibold text-white'
                    : 'border-[var(--color-admin-card-border)] bg-white text-[#0f172a] hover:bg-slate-50 dark:bg-[#111318] dark:text-white dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ))}

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
