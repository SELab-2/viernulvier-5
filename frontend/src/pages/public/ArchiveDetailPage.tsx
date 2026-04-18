import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getActiveLocale, withLocalePath } from '../../i18n'
import { localize } from '../../utils/localize'
import PublicLayout from '../../components/public/PublicLayout'
import PublicPillButton from '../../components/public/PublicPillButton'
import { usePublicMessages } from '../../components/public/PublicMessagesContext'
import ArchiveDetailHero from '../../components/public/detail/PublicDetailHeroBanner'
import ArchiveDetailEventsList from '../../components/public/detail/PublicDetailEventsList'
import ArchiveDetailGallery from '../../components/public/detail/PublicDetailGallery'
import { getProductionById, type Production } from '../../api/productions'
import { getGalleryItems, getItemCrops, getPreferredCropUrl } from '../../api/media'
import { getEventsByProductionId, type Event } from '../../api/events'
import { getHallById } from '../../api/halls'
import { getSpaceById } from '../../api/spaces'
import { getLocationById, type Location } from '../../api/locations'

function getYouTubeEmbedUrl(url: string): string | null {
    const match =
        url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
        url.match(/youtu\.be\/([^?]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function ArchiveDetailPageContent() {
    const navigate = useNavigate()
    const messages = usePublicMessages()
    const locale = getActiveLocale(window.location.pathname)
    const { id } = useParams<{ id: string }>()

    const [production, setProduction] = useState<Production | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [galleryImages, setGalleryImages] = useState<(string | null)[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [locationsByEvent, setLocationsByEvent] = useState<Record<string, Location>>({})

    const handleGoBack = () => {
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
                const [prodRes, eventsRes] = await Promise.all([
                    getProductionById(id),
                    getEventsByProductionId(id),
                ])

                const prod = prodRes.data
                const now = new Date()
                const pastEvents = eventsRes.data.filter(
                    (e) => e.starts_at && new Date(e.starts_at) < now
                )

                setProduction(prod)
                setEvents(pastEvents)

                if (prod.media_gallery_id) {
                    const galleryRes = await getGalleryItems(prod.media_gallery_id)
                    const items = galleryRes.data

                    if (items.length > 0) {
                        const firstCrops = await getItemCrops(items[0].id)
                        setImageUrl(getPreferredCropUrl(firstCrops.data))

                        const allCrops = await Promise.all(items.map((item) => getItemCrops(item.id)))
                        setGalleryImages(allCrops.map((res) => getPreferredCropUrl(res.data)))
                    }
                }

                const locationResults = await Promise.all(
                    pastEvents.map(async (event) => {
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
                )

                const locationMap: Record<string, Location> = {}
                locationResults.forEach((res) => {
                    if (res) locationMap[res.eventId] = res.location
                })
                setLocationsByEvent(locationMap)

            } catch (error) {
                console.error('Error loading data:', error)
            }
        }

        fetchData()
    }, [id])

    const title = localize(production?.title, locale)
    const superTitle = localize(production?.super_title, locale)
    const artist = localize(production?.artist, locale)
    const teaser = localize(production?.teaser, locale)
    const description = localize(production?.description, locale)
    const description2 = localize(production?.description_2, locale)
    const quote = localize(production?.quote, locale)
    const quoteSource = localize(production?.quote_source, locale)
    const info = localize(production?.info, locale)
    const video1 = localize(production?.video_1, locale)
    const video2 = localize(production?.video_2, locale)

    const videos = [video1, video2]
        .filter(Boolean)
        .map((url) => getYouTubeEmbedUrl(url as string))
        .filter(Boolean)

    return (
        <>
            <div className="site-container mt-8">
                <PublicPillButton
                    label={messages.detail.navBackToOverview}
                    onClick={handleGoBack}
                />
            </div>

            {imageUrl && (
                <div className="site-container mt-6">
                    <ArchiveDetailHero
                        imageUrl={imageUrl}
                        title={title}
                        superTitle={superTitle}
                        artist={artist}
                    />

                    <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-xl font-bold mb-4">{messages.detail.events}</h2>
                            <ArchiveDetailEventsList
                                events={events}
                                locationsByEvent={locationsByEvent}
                                locale={locale}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="site-container py-8 space-y-12">
                {teaser && (
                    <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: teaser.replace(/\r?\n/g, '<br />') }} />
                    </div>
                )}

                {description && (
                    <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: description.replace(/\r?\n/g, '<br />') }} />
                    </div>
                )}

                {videos.length > 0 && (
                    <div
                        className={`mx-auto gap-6 ${
                            videos.length === 1
                                ? 'max-w-3xl'
                                : 'max-w-5xl grid grid-cols-1 md:grid-cols-2'
                        }`}
                    >
                        {videos.map((videoUrl, index) => (
                            <div key={index} className="w-full aspect-video rounded-xl overflow-hidden">
                                <iframe
                                    src={videoUrl!}
                                    title={`Video ${index + 1}`}
                                    className="w-full h-full"
                                    loading="lazy"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ))}
                    </div>
                )}

                {quote && (
                    <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: quote.replace(/\r?\n/g, '<br />') }} />
                        {quoteSource && (
                            <p className="text-sm text-right mt-2">— {quoteSource}</p>
                        )}
                    </div>
                )}

                {galleryImages.length > 0 && (
                    <ArchiveDetailGallery images={galleryImages} />
                )}

                {description2 && (
                    <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: description2.replace(/\r?\n/g, '<br />') }} />
                    </div>
                )}

                {info && (
                    <div className="prose max-w-none">
                        <h2 className="text-xl font-bold mb-4">{messages.detail.credits}</h2>
                        <div dangerouslySetInnerHTML={{ __html: info.replace(/\r?\n/g, '<br />') }} />
                    </div>
                )}
            </div>
        </>
    )
}

function ArchiveDetailPage() {
    return (
        <PublicLayout>
            <ArchiveDetailPageContent />
        </PublicLayout>
    )
}

export default ArchiveDetailPage
