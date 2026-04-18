import { useState } from 'react'
import type { Event } from '../../../api/events'
import type { Location } from '../../../api/locations'
import { usePublicMessages } from '../PublicMessagesContext'

type ArchiveDetailEventsListProps = {
    events: Event[]
    locationsByEvent: Record<string, Location>
    locale: string
}

function ArchiveDetailEventsList({ events, locationsByEvent, locale }: ArchiveDetailEventsListProps) {
    const messages = usePublicMessages()
    const [showAll, setShowAll] = useState(false)
    const visible = showAll ? events : events.slice(0, 5)

    if (events.length === 0) {
        return <p>{messages.detail.noEvents}</p>
    }

    return (
        <div>
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-[var(--color-border)] font-semibold text-sm">
                <div>{messages.detail.date}</div>
                <div>{messages.detail.time}</div>
                <div>{messages.detail.location}</div>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
                {visible.map((event) => {
                    const start = event.starts_at ? new Date(event.starts_at) : null
                    const end = event.ends_at ? new Date(event.ends_at) : null
                    const location = locationsByEvent[event.id]

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
                        <div key={event.id} className="grid grid-cols-3 gap-4 p-4 text-sm">
                            <div className="font-medium">
                                {start
                                    ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(start)
                                    : '—'}
                            </div>
                            <div className="text-[var(--color-text-muted)]">
                                {start
                                    ? new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(start)
                                    : '—'}
                                {end &&
                                    ` - ${new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(end)}`}
                            </div>
                            <div className="text-[var(--color-text-accent)]">{locationLabel}</div>
                        </div>
                    )
                })}
            </div>

            {events.length > 5 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="mt-4 text-sm font-medium text-[var(--color-text)] hover:underline"
                >
                    {showAll ? messages.detail.showLess : messages.detail.showMore}
                </button>
            )}
        </div>
    )
}

export default ArchiveDetailEventsList