import { useAdminMessages } from './AdminMessagesContext'
import {useDashboardFormatters} from "./hooks/useDashboardFormatters.ts";

export type LanguageState = 'complete' | 'attention' | 'missing'
export type ProductionStatus = 'published' | 'concept'

export type ProductionRow = {
    id: string
    title: string
    type: string
    status: ProductionStatus
    languageStatus: { nl: LanguageState; en: LanguageState }
    updatedAt: string
}

type ProductionsTableProps = {
    items: ProductionRow[]
    isLoading: boolean
    pageSize: number
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
    deletingId?: string | null
}

export function ProductionsTable({
                                     items,
                                     isLoading,
                                     pageSize,
                                     onEdit,
                                     onDelete,
                                     deletingId,
                                 }: ProductionsTableProps) {
    const messages = useAdminMessages()
    const d = messages.admin.dashboard
    const { formatDate } = useDashboardFormatters()

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse table-fixed">
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
                            className="border-b border-[var(--color-admin-card-border)] px-6 py-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#475569]"
                        >
                            {heading}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {items.map((item) => (
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
                        <td className="px-6 py-4">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-[#475569] dark:bg-slate-800 dark:text-slate-300">
                  {item.type}
                </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 text-xs text-[#059669]">
                                    <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                                {d.statusAvailable}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex gap-3 text-[9px] uppercase tracking-[0.08em] text-slate-500">
                                {(['nl', 'en'] as const).map((loc) => {
                                    const state = item.languageStatus[loc]
                                    const dotClass = state === 'complete'
                                        ? 'bg-[#10b981]'
                                        : state === 'attention'
                                            ? 'bg-[#f59e0b]'
                                            : 'bg-[#cbd5e1]'
                                    const tooltip = state === 'complete'
                                        ? d.languageStatusComplete
                                        : state === 'attention'
                                            ? d.languageStatusAttention
                                            : d.languageStatusMissing

                                    return (
                                        <span
                                            key={loc}
                                            className={`inline-block cursor-help rounded-sm focus:outline-none focus:ring-2 focus:ring-accent/40 ${state === 'missing' ? 'opacity-40' : ''}`}
                                            title={tooltip}
                                            aria-label={`${loc.toUpperCase()}: ${tooltip}`}
                                            tabIndex={0}
                                        >
                                        <span className="block">{loc}</span>
                                        <span
                                            aria-hidden="true"
                                            className={`mt-1 block h-2 w-2 rounded-full ${dotClass}`}
                                        />
                                      </span>
                                    )
                                })}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#475569] dark:text-slate-300">{formatDate(item.updatedAt)}</td>
                        <td className="px-6 py-4">
                            <div className="flex gap-1">
                                {onEdit ? (
                                    <button
                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                        onClick={() => onEdit(item.id)}
                                    >
                                        {d.actionEdit}
                                    </button>
                                ) : null}
                                {onDelete ? (
                                    <button
                                        disabled={deletingId === item.id}
                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                        onClick={() => onDelete(item.id)}
                                    >
                                        {d.actionDelete}
                                    </button>
                                ) : null}
                            </div>
                        </td>
                    </tr>
                ))}
                {!isLoading && items.length === 0 ? (
                    <tr className="h-[72px]">
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                            {d.emptyRecent}
                        </td>
                    </tr>
                ) : null}
                {!isLoading && items.length > 0 && items.length < pageSize
                    ? Array.from({ length: pageSize - items.length }).map((_, i) => (
                        <tr key={`placeholder-${i}`} className="h-[72px] border-t border-slate-100 dark:border-slate-800" aria-hidden>
                            <td colSpan={6} />
                        </tr>
                    ))
                    : null}
                </tbody>
            </table>
        </div>
    )
}
