import SectionTitle from './SectionTitle'
import PublicPillButton from './PublicPillButton'
import { usePublicMessages } from './PublicMessagesContext'
import { localize } from '../../utils/localize'
import { toPlainText } from '../../utils/text'
import type { Production } from '../../api/productions'
import {RightChevronIcon} from '../shared/icons'

type PublicRecentDigitizedProps = {
    items: Production[]
    locale: 'nl' | 'en'
    fallbackUntitled: string
    onViewItem: (id: string) => void
    onViewAll: () => void
}

function formatArchiveLabel(apiId: string | null | undefined): string | undefined {
    if (!apiId) {
        return undefined
    }

    const trimmed = apiId.trim()
    if (!trimmed) {
        return undefined
    }

    const lastSegment = trimmed.split('/').filter(Boolean).at(-1)
    if (!lastSegment) {
        return undefined
    }

    return /^\d+$/.test(lastSegment) ? `#${lastSegment}` : lastSegment
}

function PublicRecentDigitized({
    items,
    locale,
    fallbackUntitled,
    onViewItem,
    onViewAll,
}: PublicRecentDigitizedProps) {
    const messages = usePublicMessages()

    const renderedItems = items.map((item) => {
        const title = localize(item.title, locale) || fallbackUntitled
        const descriptionRaw =
            localize(item.description_short, locale) ||
            localize(item.teaser, locale) ||
            localize(item.description, locale) ||
            title

        return {
            id: item.id,
            archiveLabel: formatArchiveLabel(item.apiId),
            title,
            description: toPlainText(descriptionRaw) || title || fallbackUntitled,
        }
    })

    return (
        <section className="site-container mt-20 pb-10">
            <SectionTitle title={messages.home.recentDigitizedHeading} />

            <div className="mt-6">
                {renderedItems.map((item) => (
                    <article
                        key={item.id}
                        className="grid grid-cols-[1fr_auto] items-center gap-x-4 border-t border-foreground/25 py-7"
                    >
                        <div className="grid gap-4 pr-2 md:grid-cols-[160px_1fr] md:items-center md:gap-6">
                            <div>
                                {item.archiveLabel ? (
                                    <p className="text-sm font-semibold uppercase tracking-wide text-foreground">{item.archiveLabel}</p>
                                ) : null}
                            </div>

                            <div>
                                <h3 className="text-2xl font-medium leading-tight text-foreground">{item.title}</h3>
                                <p className="mt-3 overflow-hidden text-base leading-relaxed text-text-accent [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">{item.description}</p>
                            </div>
                        </div>

                        <div className="self-center justify-self-end">
                            <button
                                type="button"
                                aria-label={`${messages.home.recentDigitizedViewItem}: ${item.title}`}
                                onClick={() => onViewItem(item.id)}
                                className="inline-flex h-10 w-10 items-center justify-center text-accent transition hover:text-foreground md:hidden"
                            >
                                <RightChevronIcon className="h-8 w-8" />
                            </button>
                            <div className="hidden md:block">
                                <PublicPillButton
                                    label={messages.home.recentDigitizedViewItem}
                                    onClick={() => onViewItem(item.id)}
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
