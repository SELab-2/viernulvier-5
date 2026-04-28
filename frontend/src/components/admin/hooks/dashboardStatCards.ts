import type { Messages } from '../../../i18n/types'
import type { DashboardSummary } from './useDashboardSummary'

export type DeltaInfo = DashboardSummary['deltas']['productions']

export type StatCard = {
  label: string
  value: string
  change: string
  note: string | null
  accent: string
  pill: string
  iconSrc: string
  iconAlt: string
}

type DashboardMessages = Messages['admin']['dashboard']

type BuildStatCardsArgs = {
  formatCount: (value: number) => string
  formatDate: (value: string | null) => string
  formatDelta: (delta: DeltaInfo | undefined) => string
  pillClasses: (delta: DeltaInfo | undefined) => string
  messages: DashboardMessages
}

export function pillClasses(delta: DeltaInfo | undefined): string {
  const direction = delta?.direction ?? 'flat'

  if (direction === 'up') {
    return 'bg-[#ecfdf5] text-[#10b981]'
  }

  if (direction === 'down') {
    return 'bg-[#fef2f2] text-[#ef4444]'
  }

  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
}

export function buildStatCards(
  summary: DashboardSummary | null,
  { formatCount, formatDate, formatDelta, pillClasses: resolvePillClasses, messages }: BuildStatCardsArgs,
): StatCard[] {
  const productionsDelta = summary?.deltas?.productions
  const blogsDelta = summary?.deltas?.blogs

  return [
    {
      label: messages.statProductions,
      value: summary ? formatCount(summary.counts.productions) : '—',
      change: formatDelta(productionsDelta),
      note: productionsDelta?.changePct !== null && productionsDelta !== undefined ? messages.deltaVsLastMonth : null,
      accent: 'bg-[rgba(236,19,55,0.1)] text-[#ec1337]',
      pill: resolvePillClasses(productionsDelta),
      iconSrc: '/admin/dashboard/productions-icon.svg',
      iconAlt: messages.statProductions,
    },
    {
      label: messages.statBlogConcepts,
      value: summary ? formatCount(summary.counts.blogs) : '—',
      change: formatDelta(blogsDelta),
      note: blogsDelta?.changePct !== null && blogsDelta !== undefined ? messages.deltaVsLastMonth : null,
      accent: 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]',
      pill: resolvePillClasses(blogsDelta),
      iconSrc: '/admin/dashboard/concepts-icon.svg',
      iconAlt: messages.statBlogConcepts,
    },
    {
      label: messages.statVisitors,
      value: messages.visitorsPlaceholder,
      change: messages.visitorsChange,
      note: messages.visitorsNote,
      accent: 'bg-[rgba(59,130,246,0.1)] text-[#2563eb]',
      pill: 'bg-[rgba(59,130,246,0.08)] text-[#2563eb]',
      iconSrc: '/admin/dashboard/visitors-icon.svg',
      iconAlt: messages.statVisitors,
    },
    {
      label: messages.statMediaItems,
      value: summary ? formatCount(summary.counts.mediaItems) : '—',
      change: summary?.lastScrapedAt ? formatDate(summary.lastScrapedAt) : messages.notSyncedYet,
      note: summary?.lastScrapedAt ? messages.statLastSync : messages.statSyncPending,
      accent: 'bg-[rgba(168,85,247,0.1)] text-accent',
      pill: 'bg-[#ecfdf5] text-[#10b981]',
      iconSrc: '/admin/dashboard/media-icon.svg',
      iconAlt: messages.statMediaItems,
    },
  ]
}
