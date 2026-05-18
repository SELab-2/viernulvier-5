import SectionTitle from './SectionTitle'
import PublicPillButton from './PublicPillButton'
import { usePublicMessages } from './PublicMessagesContext'
import {RightChevronIcon} from '../shared/icons'

type PublicRecentDigitizedProps = {
    onViewItem: (index: number) => void
    onViewAll: () => void
}

function PublicRecentDigitized({
    onViewItem,
    onViewAll,
}: PublicRecentDigitizedProps) {
    const messages = usePublicMessages()

    return (
        <section className="site-container mt-20 pb-10">
            <SectionTitle title={messages.home.recentDigitizedHeading} />

            <div className="mt-6">
                {messages.home.recentDigitizedItems.map((item, index) => (
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
                                aria-label={`${messages.home.recentDigitizedViewItem}: ${item.title}`}
                                onClick={() => onViewItem(index)}
                                className="inline-flex h-10 w-10 items-center justify-center text-accent transition hover:text-foreground md:hidden"
                            >
                                <RightChevronIcon className="h-8 w-8" />
                            </button>
                            <div className="hidden md:block">
                                <PublicPillButton
                                    label={messages.home.recentDigitizedViewItem}
                                    onClick={() => onViewItem(index)}
                                    className="min-w-28"
                                />
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <div className="flex justify-center border-t border-foreground/25 pt-8">
                <PublicPillButton label={messages.home.recentDigitizedViewAll} onClick={onViewAll} />
            </div>
        </section>
    )
}

export default PublicRecentDigitized
