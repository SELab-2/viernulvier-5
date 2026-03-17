import SectionTitle from './SectionTitle'
import PublicPillButton from './PublicPillButton'

function RightChevronIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={className}>
            <path d="M8 5l8 7-8 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export type RecentDigitizedItem = {
    dateLabel: string
    archiveLabel: string
    title: string
    description: string
}

type PublicRecentDigitizedProps = {
    heading: string
    items: RecentDigitizedItem[]
    viewItemLabel: string
    viewAllLabel: string
    onViewItem: (index: number) => void
    onViewAll: () => void
}

function PublicRecentDigitized({
    heading,
    items,
    viewItemLabel,
    viewAllLabel,
    onViewItem,
    onViewAll,
}: PublicRecentDigitizedProps) {
    return (
        <section className="site-container mt-20 pb-10">
            <SectionTitle title={heading} />

            <div className="mt-6">
                {items.map((item, index) => (
                    <article
                        key={`${item.title}-${index}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-x-4 border-t border-foreground/25 py-7"
                    >
                        <div className="grid gap-4 pr-2 md:grid-cols-[160px_1fr] md:items-center md:gap-6">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-wide text-foreground">{item.dateLabel}</p>
                                <p className="mt-1 text-sm text-text-accent hidden md:block">{item.archiveLabel}</p>
                            </div>

                            <div>
                                <h3 className="text-2xl font-medium leading-tight text-foreground">{item.title}</h3>
                                <p className="mt-3 text-base leading-relaxed text-text-accent">{item.description}</p>
                            </div>
                        </div>

                        <div className="self-center justify-self-end">
                            <button
                                type="button"
                                aria-label={`${viewItemLabel}: ${item.title}`}
                                onClick={() => onViewItem(index)}
                                className="inline-flex h-10 w-10 items-center justify-center text-accent transition hover:text-foreground md:hidden"
                            >
                                <RightChevronIcon className="h-8 w-8" />
                            </button>
                            <div className="hidden md:block">
                                <PublicPillButton label={viewItemLabel} onClick={() => onViewItem(index)} className="min-w-28" />
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <div className="flex justify-center border-t border-foreground/25 pt-8">
                <PublicPillButton label={viewAllLabel} onClick={onViewAll} />
            </div>
        </section>
    )
}

export default PublicRecentDigitized
