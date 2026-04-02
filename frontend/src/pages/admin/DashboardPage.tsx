import AdminLayout from '../../components/admin/AdminLayout'
import { useDashboardSummary } from '../../components/admin/useDashboardSummary'

const formatter = new Intl.NumberFormat('nl-BE')

function formatCount(value: number): string {
    return formatter.format(value)
}

function formatDate(value: string | null): string {
    if (!value) {
        return 'Nog niet gesynchroniseerd'
    }

    return new Intl.DateTimeFormat('nl-BE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value))
}

function DashboardPage() {
    const { summary, isLoading, error } = useDashboardSummary()

    const stats = [
        {
            label: 'Producties',
            value: summary ? formatCount(summary.counts.productions) : '—',
            change: '+ live data',
            note: 'geïmporteerd archief',
            accent: 'bg-[rgba(236,19,55,0.1)] text-[#ec1337]',
            pill: 'bg-[#ecfdf5] text-[#10b981]',
            iconSrc: '/admin/dashboard/productions-icon.svg',
            iconAlt: 'Producties icoon',
        },
        {
            label: 'Events',
            value: summary ? formatCount(summary.counts.events) : '—',
            change: '+ gekoppeld',
            note: 'gekoppelde speeldata',
            accent: 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]',
            pill: 'bg-[#fffbeb] text-[#d97706]',
            iconSrc: '/admin/dashboard/concepts-icon.svg',
            iconAlt: 'Events icoon',
        },
        {
            label: 'Bezoekers',
            value: 'Binnenkort',
            change: 'placeholder',
            note: 'analytics volgt later',
            accent: 'bg-[rgba(59,130,246,0.1)] text-[#2563eb]',
            pill: 'bg-[rgba(59,130,246,0.08)] text-[#2563eb]',
            iconSrc: '/admin/dashboard/visitors-icon.svg',
            iconAlt: 'Bezoekers icoon',
        },
        {
            label: 'Media Items',
            value: summary ? formatCount(summary.counts.mediaItems) : '—',
            change: summary?.lastScrapedAt ? formatDate(summary.lastScrapedAt) : 'placeholder',
            note: summary?.lastScrapedAt ? 'laatste sync' : 'syncstatus volgt',
            accent: 'bg-[rgba(168,85,247,0.1)] text-accent',
            pill: 'bg-[#ecfdf5] text-[#10b981]',
            iconSrc: '/admin/dashboard/media-icon.svg',
            iconAlt: 'Media items icoon',
        },
    ]

    const recentItems = summary?.recentItems ?? []
    const userName = 'Artevelde stagiair'
    const userRole = summary ? `${summary.counts.editors} editors actief` : 'Administrator'

    return (
        <AdminLayout mainClassName="px-4 py-8 lg:px-8 lg:py-8" userName={userName} userRole={userRole} showSidebar>
            <section className="mx-auto flex w-full max-w-[960px] flex-col gap-6">
                <header className="space-y-1">
                    <h1 className="text-[2rem] leading-9 font-normal tracking-[-0.05em] text-[#0f172a] dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-base leading-6 text-[#475569] dark:text-slate-300">
                        Hier is een overzicht van laatste archiefactiviteit en metadata status.
                    </p>
                    <p className="text-sm leading-5 text-[#94a3b8] dark:text-slate-500">
                        Bezoekersinzichten blijven voorlopig een gestileerde placeholder tot de analytics-koppeling klaar is.
                    </p>
                </header>

                {isLoading ? (
                    <div className="rounded-xl border border-[var(--color-admin-card-border)] bg-white px-4 py-3 text-sm text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318] dark:text-slate-300">
                        Dashboard wordt geladen...
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
                                <span className="text-xs text-[#94a3b8] dark:text-slate-500">{card.note}</span>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="space-y-4">
                    <div>
                        <h2 className="text-2xl leading-9 font-normal tracking-[-0.04em] text-[#0f172a] dark:text-white">Recent bewerkt</h2>
                    </div>

                    <div className="overflow-hidden rounded-[12px] border border-[var(--color-admin-card-border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-[#111318]">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead className="bg-[rgba(248,250,252,0.7)] dark:bg-slate-900/60">
                                    <tr>
                                        {['Titel', 'Type', 'Status', 'Taal Status', 'Datum', 'Acties'].map((heading) => (
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
                                    {recentItems.map((item) => (
                                        <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                                        {item.title.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-base text-[#0f172a] dark:text-white">{item.title}</span>
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
                                                    Beschikbaar in archief
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-3 text-[9px] uppercase tracking-[0.08em] text-slate-500">
                                                    {(['nl', 'en'] as const).map((locale) => {
                                                        const state = item.languageStatus[locale]
                                                        const dotClass = state === 'complete'
                                                            ? 'bg-[#10b981]'
                                                            : state === 'attention'
                                                                ? 'bg-[#f59e0b]'
                                                                : 'bg-[#cbd5e1]'

                                                        return (
                                                            <div key={locale} className={state === 'missing' ? 'opacity-40' : ''}>
                                                                <div>{locale}</div>
                                                                <div className={`mt-1 h-2 w-2 rounded-full ${dotClass}`} />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#475569] dark:text-slate-300">{formatDate(item.updatedAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
                                                        Bekijk
                                                    </button>
                                                    <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
                                                        Bewerk
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!isLoading && recentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                                                Nog geen recente archiefitems gevonden.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 text-xs text-[#475569] sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            {summary
                                ? `Toont 1-${recentItems.length} van ${summary.counts.productions + summary.counts.events} resultaten`
                                : 'Toont recente resultaten'}
                        </p>
                        <div className="flex gap-1">
                            {['‹', '1', '2', '3', '›'].map((token, index) => (
                                <button
                                    key={token + index}
                                    className={[
                                        'flex h-8 w-8 items-center justify-center rounded border text-xs',
                                        token === '1'
                                            ? 'border-accent bg-accent text-white'
                                            : 'border-[var(--color-admin-card-border)] bg-white text-[#0f172a] dark:bg-[#111318] dark:text-white',
                                    ].join(' ')}
                                >
                                    {token}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </section>
        </AdminLayout>
    )
}

export default DashboardPage
