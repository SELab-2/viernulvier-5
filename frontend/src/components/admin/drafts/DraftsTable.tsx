import { useAdminMessages } from '../AdminMessagesContext'
import { useDashboardFormatters } from '../hooks/useDashboardFormatters'
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import DeleteConfirmModal from "./DeleteConfirmModal.tsx";
import {api} from "../../../api/client.ts";
import {usePagination} from "../hooks/usePagination.ts";

export type FixedPageSize = 3 | 6 | 9 | 12 | 15 | 18

export type LocalizedString = {
    nl: string
    en: string
}

export type DraftItem = {
    id: string
    title: LocalizedString
    updated_at: string
    editors: EditorItem[]
}

type DraftsTableProps = {
    items: DraftItem[]
    isLoading: boolean
    tab: 'productions' | 'blogs'
    currentUserId?: string
    onDeleted: () => void
    pageSize: number
    page: number
    totalItems: number
    onPageChange: (page: number) => void
    pageSizeOptions: readonly number[]
    onPageSizeChange: (size: FixedPageSize) => void
}

export type EditorItem = {
    id: string
}


function DraftsTable({ items, isLoading, tab, currentUserId, onDeleted, pageSize, page, totalItems, onPageChange, pageSizeOptions, onPageSizeChange}: DraftsTableProps) {
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null)

    const messages = useAdminMessages();
    const d = messages.admin.drafts;
    const { formatDate, locale } = useDashboardFormatters();
    const navigate = useNavigate();

    const adminBaseRoute =
        tab === "productions"
            ? "/admin/archive"
            : "/admin/blogs";

    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!selectedDraft) return

        setIsDeleting(true)

        try {
            const route = tab === 'productions'
                ? `/archive/productions/${selectedDraft.id}`
                : `/archive/blogs/${selectedDraft.id}`

            await api.delete<unknown>(route)
            setShowDeleteModal(false)
            setSelectedDraft(null)
            onDeleted()
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'Verwijderen mislukt.')
        } finally {
            setIsDeleting(false)
        }
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const from = (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, totalItems)
    const { items: paginationItems } = usePagination({ page, totalPages, siblings: 1, pageSize, totalItems })

    return (
        <div
            className="overflow-hidden rounded-[12px] border border-[var(--color-admin-card-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] table-fixed border-collapse">
                    <colgroup>
                        <col className="w-[30%]"/>
                        <col className="w-[20%]"/>
                        <col className="w-[10%]"/>
                        <col className="w-[16%]"/>
                        <col className="w-[24%]"/>
                    </colgroup>
                    <thead className="bg-[rgba(248,250,252,0.7)] dark:bg-slate-900/60">
                    <tr>
                        {[
                            d.tableColTitle,
                            d.tableColStatus,
                            d.tableColEditor,
                            d.tableColDate,
                            d.tableColActions,
                        ].map((heading) => (
                            <th
                                key={heading}
                                className="border-b border-[var(--color-admin-card-border)] px-4 py-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#475569] dark:text-slate-400"
                            >
                                {heading}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((item) => {
                        const displayTitle = item.title?.[locale] || item.title?.nl || item.title?.en || 'Untitled'
                        return (
                            <tr key={item.id} className="h-[72px] border-t border-slate-100 dark:border-slate-800">
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                            {displayTitle.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span
                                            className="block min-w-0 flex-1 truncate text-base text-[#0f172a] dark:text-white"
                                            title={displayTitle}>
                                            {displayTitle}
                                        </span>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-4">
                                    <span
                                        className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-red-600 dark:text-red-400">
                                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500"/>
                                        {d.statusUnavailable}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    {item.editors.some((editor) => editor.id === currentUserId) ? (
                                        <span
                                            className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-emerald-600 dark:text-emerald-400">
                                            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd"
                                                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                                      clipRule="evenodd"/>
                                            </svg>
                                        </span>
                                    ) : (
                                        <span
                                            className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
                                            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
                                            </svg>
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-sm text-[#475569] dark:text-slate-300">
                                    {formatDate(item.updated_at)}</td>
                                <td className="px-4 py-4">
                                    <div className="flex gap-1 -ml-2">
                                        <button
                                            onClick={() => navigate(`${adminBaseRoute}/${item.id}`)}
                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                                            {d.actionView}
                                        </button>
                                        <button
                                            onClick={() => navigate(`${adminBaseRoute}/${item.id}/edit`)}
                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                                            {d.actionEdit}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedDraft(item)
                                                setShowDeleteModal(true)
                                            }}
                                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                                            {d.actionDelete}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}

                    {!isLoading && items.length === 0 && (
                        <tr className="h-[72px]">
                            <td colSpan={6}
                                className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                {d.emptyRecent}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-4">
                    {totalItems > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {d.paginationShowing(from, to, totalItems)}
                        </p>
                    )}
                    <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{d.pageSizeLabel}</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value) as FixedPageSize)}
                            className="rounded-md border border-[var(--color-admin-card-border)] bg-white px-2 py-1 text-xs text-[#0f172a] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent/40 dark:bg-[#111318] dark:text-white dark:hover:bg-slate-800"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        aria-label={d.paginationPrev}
                        disabled={page === 1}
                        onClick={() => onPageChange(Math.max(1, page - 1))}
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
                                onClick={() => onPageChange(item)}
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
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-admin-card-border)] bg-white text-sm text-[#475569] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#111318] dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        ›
                    </button>
                </div>
            </div>
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                title={d.deleteTitle}
                message={d.deleteConfirm(selectedDraft?.title?.[locale] ?? selectedDraft?.title?.nl ?? '')}
                isDeleting={isDeleting}
                onCancel={() => {
                    setShowDeleteModal(false)
                    setSelectedDraft(null)
                }}
                onConfirm={handleDelete}
            />
        </div>

    )
}

export default DraftsTable
