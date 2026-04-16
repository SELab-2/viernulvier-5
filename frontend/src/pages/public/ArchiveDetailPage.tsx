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
    const [galleryImages, setGalleryImages] = useState<(string | null)[]>([])

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

        const fetchData = async () => {
            try {
                // 🔹 1. Fetch production + events in parallel
                const [prodRes, eventsRes] = await Promise.all([
                    getProductionById(id),
                    getEventsByProductionId(id),
                ])

                const prod = prodRes.data
                const evts = eventsRes.data

                setProduction(prod)
                setEvents(evts)

                // 🔹 2. Handle gallery
                if (prod.media_gallery_id) {
                    const galleryRes = await getGalleryItems(prod.media_gallery_id)
                    const items = galleryRes.data

                    if (items.length > 0) {
                        // 👉 Hero image (first item)
                        const firstCrops = await getItemCrops(items[0].id)
                        setImageUrl(getPreferredCropUrl(firstCrops.data))

                        // 👉 (Optional) all gallery images
                        const allCrops = await Promise.all(
                            items.map((item) => getItemCrops(item.id))
                        )
                        const galleryImages = allCrops.map((res) =>
                            getPreferredCropUrl(res.data)
                        )
                        setGalleryImages(galleryImages)
                    }
                }

                // 🔹 3. Fetch locations for events (parallel per event)
                const locationPromises = evts.map(async (event) => {
                    if (!event.hall_id) return null

                    try {
                        const hall = (await getHallById(event.hall_id)).data
                        if (!hall.space_id) return null

                        const space = (await getSpaceById(hall.space_id)).data
                        if (!space.location_id) return null

                        const location = (await getLocationById(space.location_id)).data

                        return { eventId: event.id, location }
                    } catch {
                        return null
                    }
                })

                const locationResults = await Promise.all(locationPromises)

                const locationMap: Record<string, Location> = {}

                locationResults.forEach((res) => {
                    if (res) {
                        locationMap[res.eventId] = res.location
                    }
                })

                setLocationsByEvent(locationMap)

            } catch (error) {
                console.error('Error loading data:', error)
            }
        }

        fetchData()
    }, [id])

    const title =
        production?.title?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.title?.en ||
        production?.title?.nl ||
        production?.title?.fr

    const super_title =
        production?.super_title?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.super_title?.en ||
        production?.super_title?.nl ||
        production?.super_title?.fr
    
    const artist = 
        production?.artist?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.artist?.en ||
        production?.artist?.nl ||
        production?.artist?.fr

    const teaser =
        production?.teaser?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.teaser?.en ||
        production?.teaser?.nl ||
        production?.teaser?.fr
    
    const description =
        production?.description?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.description?.en ||
        production?.description?.nl ||
        production?.description?.fr

    const description_extra =
        production?.description_extra?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.description_extra?.en ||
        production?.description_extra?.nl ||
        production?.description_extra?.fr
        
    const description_2 =
        production?.description_2?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.description_2?.en ||
        production?.description_2?.nl ||
        production?.description_2?.fr

    const video_1 =
        production?.video_1?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.video_1?.en ||
        production?.video_1?.nl ||
        production?.video_1?.fr

    const video_2 =
        production?.video_2?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.video_2?.en ||
        production?.video_2?.nl ||
        production?.video_2?.fr

    const quote =
        production?.quote?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.quote?.en ||
        production?.quote?.nl ||
        production?.quote?.fr

    const quote_source =
        production?.quote_source?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.quote_source?.en ||
        production?.quote_source?.nl ||
        production?.quote_source?.fr

    const info =
        production?.info?.[locale as 'en' | 'nl' | 'fr'] ||
        production?.info?.en ||
        production?.info?.nl ||
        production?.info?.fr

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
                            
                            <h1 className="text-1xl md:text-1xl text-white">
                                {super_title || 'Untitled'}
                            </h1>
                            
                            <h1 className="text-3xl md:text-4xl font-bold text-white">
                                {title || 'Untitled'}
                            </h1>

                            {artist && (
                                <p className="text-2xl md:text-2xl text-white mt-1">
                                    {artist}
                                </p>
                            )}
                        </div>
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
                </div>
            
            )}

            <div className="site-container py-8 space-y-12">

                <div className="prose max-w-none">
                    {teaser ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: teaser.replace(/\r?\n/g, '<br />') }}
                        />
                    ) : (
                        <p>No teaser available.</p>
                    )}
                </div>

                <div className="prose max-w-none">
                    {description ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: description.replace(/\r?\n/g, '<br />') }}
                        />
                    ) : (
                        <p>No description available.</p>
                    )}
                </div>

                <div>
                    {/* video_1/video_2 */}
                </div>

                <div className="prose max-w-none">
                    {quote ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: quote.replace(/\r?\n/g, '<br />') }}
                        />
                        
                    ) : (
                        <p>No quote available.</p>
                    )}
                    {quote_source && (
                        <p className="text-sm text-right mt-2">
                            — {quote_source}
                        </p>
                    )}
                </div>

                <div className="prose max-w-none">
                    {description_2 ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: description_2.replace(/\r?\n/g, '<br />') }}
                        />
                    ) : (
                        <p>No description_2 available.</p>
                    )}
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