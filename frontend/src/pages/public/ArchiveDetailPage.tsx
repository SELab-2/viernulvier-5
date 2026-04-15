import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicPillButton from '../../components/public/PublicPillButton'
import { getProductionById, type Production } from '../../api/productions'
import { getGalleryItems, getItemCrops, getPreferredCropUrl } from '../../api/media'
import { getEventsByProductionId, type Event } from '../../api/events'
import { getHallById } from '../../api/halls'
import { getSpaceById } from '../../api/spaces'
import { getLocationById, type Location } from '../../api/locations'

function ArchiveDetailPage() {
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const messages = getMessages()
    const { id } = useParams<{ id: string }>()

    const [production, setProduction] = useState<Production | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [events, setEvents] = useState<Event[]>([])
    const [locationsByEvent, setLocationsByEvent] = useState<Record<string, Location>>({})
    const [showAllEvents, setShowAllEvents] = useState(false)

    const visibleEvents = showAllEvents ? events : events.slice(0, 5)

    const handleGoBackToHome = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate(withLocalePath('/', locale))
        }
    }

    useEffect(() => {
        if (!id) return

        getProductionById(id).then((res) => {
            const prod = res.data
            setProduction(prod)

            if (prod.media_gallery_id) {
                getGalleryItems(prod.media_gallery_id).then((galleryRes) => {
                    const firstItem = galleryRes.data[0]
                    if (!firstItem) return
                    getItemCrops(firstItem.id).then((cropsRes) => {
                        setImageUrl(getPreferredCropUrl(cropsRes.data))
                    })
                })
            }
        })

        getEventsByProductionId(id).then((res) => {
            const evts = res.data
            console.log('Events:', evts)
            setEvents(evts)

            evts.forEach((event) => {
                console.log('Processing event:', event)
                if (!event.hall_id) {
                    console.log('Event has no hall_id')
                    return
                }

                getHallById(event.hall_id).then((hallRes) => {
                    const hall = hallRes.data
                    console.log('Hall for event', event.id, ':', hall)
                    if (!hall.space_id) {
                        console.log('Hall has no space_id')
                        return
                    }

                    getSpaceById(hall.space_id).then((spaceRes) => {
                        const space = spaceRes.data
                        console.log('Space for hall', hall.id, ':', space)
                        if (!space.location_id) {
                            console.log('Space has no location_id')
                            return
                        }
                    
                        getLocationById(space.location_id).then((locationRes) => {
                            console.log('Location for space', space.id, ':', locationRes.data)
                            setLocationsByEvent((prev) => ({
                                ...prev,
                                [event.id]: locationRes.data,
                            }))
                        })
                    })
                })
            })
        })
    }, [id])

    const title =
        production?.title?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.title?.en ||
        production?.title?.nl ||
        production?.title?.fr
    
    const artist = 
        production?.artist?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.artist?.en ||
        production?.artist?.nl ||
        production?.artist?.fr

    const description =
        production?.description?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.description?.en ||
        production?.description?.nl ||
        production?.description?.fr

    return (
        <PublicLayout>
            <div className="site-container mt-8">
                <PublicPillButton
                    label={messages.detail.navBackToOverview}
                    onClick={handleGoBackToHome}
                />
            </div>

            {imageUrl && (
                <div className="site-container mt-6">
                    <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
                        
                        {/* Background image */}
                        <img
                            src={imageUrl}
                            alt={title || 'Production image'}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay (20% dark) */}
                        <div className="absolute inset-0 bg-black/20" />

                        {/* Text on top */}
                        <div className="absolute inset-0 flex flex-col justify-end p-6">
                            <h1 className="text-3xl md:text-4xl font-bold text-white">
                                {title || 'Untitled'}
                            </h1>

                            {artist && (
                                <p className="text-lg text-white/90 mt-1">
                                    {artist}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="site-container py-8">
                <div className="prose max-w-none">
                    {description ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    ) : (
                        <p>No description available.</p>
                    )}
                </div>
                
                <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4">
                            messages.detail.dates
                        </h2>

                        {events.length === 0 ? (
                            <p>No upcoming events.</p>
                        ) : (
                            <div>
                                {/* Header row */}
                                <div className="grid grid-cols-3 gap-4 p-4 border-b border-[var(--color-border)] font-semibold text-sm">
                                    <div>Date</div>
                                    <div>Time</div>
                                    <div>Location</div>
                                </div>

                                {/* Event rows */}
                                <div className="divide-y divide-[var(--color-border)]">
                                    {visibleEvents.map((event) => {
                                        const start = event.starts_at ? new Date(event.starts_at) : null
                                        const end = event.ends_at ? new Date(event.ends_at) : null
                                        const location = locationsByEvent[event.id]

                                        return (
                                            <div key={event.id} className="grid grid-cols-3 gap-4 p-4 text-sm">
                                                {/* Date */}
                                                <div className="font-medium">
                                                    {start
                                                        ? new Intl.DateTimeFormat(locale, {
                                                            dateStyle: 'long',
                                                        }).format(start)
                                                        : '—'}
                                                </div>

                                                {/* Time */}
                                                <div className="text-[var(--color-text-muted)]">
                                                    {start
                                                        ? new Intl.DateTimeFormat(locale, {
                                                            timeStyle: 'short',
                                                        }).format(start)
                                                        : '—'}
                                                    {end &&
                                                        ` - ${new Intl.DateTimeFormat(locale, {
                                                            timeStyle: 'short',
                                                        }).format(end)}`}
                                                </div>

                                                {/* Location */}
                                                <div className="text-[var(--color-text-accent)]">
                                                    {location
                                                        ? location.name ||
                                                            [
                                                                location.street && location.number && `${location.street} ${location.number}`,
                                                                location.postal_code && location.city && `${location.postal_code} ${location.city}`
                                                            ]
                                                            .filter(Boolean)
                                                            .join(', ') || '—'
                                                        : '—'}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Show more button */}
                        {events.length > 3 && (
                            <button
                                onClick={() => setShowAllEvents(!showAllEvents)}
                                className="mt-4 text-sm font-medium text-[var(--color-accent)] hover:underline"
                            >
                                showAllEvents
                                    ? messages.detail.showLess || 'Show less'
                                    : messages.detail.showMore || 'Show more'
                            </button>
                        )}
                    </div>

                    <div>
                        {/* credits / related — coming soon */}
                    </div>
                </div>

                {/* Debug / inspection */}
                <div className="mt-8">
                    <pre className="bg-gray-100 p-4 text-xs overflow-auto">
                        {JSON.stringify(production, null, 2)}
                    </pre>
                </div>
            </div>
        </PublicLayout>
    )
}

export default ArchiveDetailPage