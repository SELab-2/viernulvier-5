import { useState } from 'react'
import type { Event } from '../../../api/events'
import type { Location } from '../../../api/locations'
import { usePublicMessages } from '../PublicMessagesContext'
import { localize } from '../../../utils/localize'

type ArchiveDetailEventsListProps = {
    events: Event[]
    locationsByEvent: Record<string, Location>
    locale: string
}

function ArchiveDetailEventsList({ events, locationsByEvent, locale }: ArchiveDetailEventsListProps) {
    const messages = usePublicMessages()
    const [showAll, setShowAll] = useState(false)
    const visible = showAll ? events : events.slice(0, 5)
    const remarkLabel = locale.startsWith('nl') ? 'Opmerking' : 'Remark'

    if (events.length === 0) {
        return <p>{messages.detail.noEvents}</p>
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="hidden grid-cols-[1fr_0.8fr_2fr_1fr] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-accent md:grid">
                <div>{messages.detail.date}</div>
                <div>{messages.detail.time}</div>
                <div>{messages.detail.location}</div>
                <div>{remarkLabel}</div>
            </div>

            <div className="divide-y divide-border">
                {visible.map((event) => {
                    const start = event.starts_at ? new Date(event.starts_at) : null
                    const end = event.ends_at ? new Date(event.ends_at) : null
                    const location = locationsByEvent[event.id]
                    const eventRemark = toPlainText(localize(event.info, locale)) || '—'

                    const locationLabel = location
                        ? location.name ||
                          [
                              location.street && location.number && `${location.street} ${location.number}`,
                              location.postal_code && location.city && `${location.postal_code} ${location.city}`,
                          ]
                              .filter(Boolean)
                              .join(', ') ||
                          '—'
                        : '—'

                    return (
                        <div key={event.id} className="px-4 py-4 md:px-5">
                            <div className="grid gap-4 md:grid-cols-[1fr_0.8fr_2fr_1fr]">
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-accent md:hidden">{messages.detail.date}</p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {start
                                            ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(start)
                                            : '—'}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-accent md:hidden">{messages.detail.time}</p>
                                    <p className="text-sm text-text-accent">
                                        {start
                                            ? new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(start)
                                            : '—'}
                                        {end && ` - ${new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(end)}`}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-accent md:hidden">{messages.detail.location}</p>
                                    <p className="text-sm text-foreground">{locationLabel}</p>
                                </div>

                                <div>
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-accent md:hidden">{remarkLabel}</p>
                                    <p className="line-clamp-2 text-sm text-text-accent">{eventRemark}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {events.length > 5 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="mx-4 my-4 inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-accent/45 hover:text-accent md:mx-5"
                >
                    {showAll ? messages.detail.showLess : messages.detail.showMore}
                </button>
            )}
        </div>
    )
}

function toPlainText(value: string | null | undefined): string {
    if (!value) {
        return ''
    }

    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\s+/g, ' ')
        .trim()
}

export default ArchiveDetailEventsList