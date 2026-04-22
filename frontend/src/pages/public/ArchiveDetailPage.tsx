import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getActiveLocale, withLocalePath } from '../../i18n'
import { localize } from '../../utils/localize'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import PublicLayout from '../../components/public/PublicLayout'
import PublicPillButton from '../../components/public/PublicPillButton'
import { usePublicMessages } from '../../components/public/PublicMessagesContext'
import ArchiveDetailHero from '../../components/public/detail/PublicDetailHeroBanner'
import ArchiveDetailEventsList from '../../components/public/detail/PublicDetailEventsList'
import ArchiveDetailGallery from '../../components/public/detail/PublicDetailGallery'
import { getProductionById, type Production } from '../../api/productions'
import { getGalleryItems, getItemCrops, getPreferredCropUrl } from '../../api/media'
import { getEventsByProductionId, type Event } from '../../api/events'
import { getGenresByProductionId, type Genre } from '../../api/genres'
import { getTagsByProductionId, type Tag } from '../../api/tags'
import { getHallById } from '../../api/halls'
import { getSpaceById } from '../../api/spaces'
import { getLocationById, type Location } from '../../api/locations'


function ArchiveDetailPageContent() {
    const navigate = useNavigate()
    const messages = usePublicMessages()
    const locale = getActiveLocale(window.location.pathname)
    const { id } = useParams<{ id: string }>()

    const [production, setProduction] = useState<Production | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [galleryImages, setGalleryImages] = useState<(string | null)[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [locationsByEvent, setLocationsByEvent] = useState<Record<string, Location>>({})
    const [shareCopied, setShareCopied] = useState(false)
    const [loadError, setLoadError] = useState(false)

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate(withLocalePath('/', locale))
        }
    }

    const formatHtml = (html: string) => {
        return html
            // 1. remove empty <p> first (before adding <br /> chaos)
            .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '')

            // 2. normalize newlines
            .replace(/\r?\n/g, '<br />')

            // 3. remove trailing <br />
            .replace(/(<br\s*\/?>\s*)+$/g, '')

            .trim()
    }

    const handleShare = async () => {
        const currentUrl = window.location.href

        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(currentUrl)
        } else {
            const textArea = document.createElement('textarea')
            textArea.value = currentUrl
            textArea.setAttribute('readonly', '')
            textArea.style.position = 'absolute'
            textArea.style.left = '-9999px'
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
        }

        setShareCopied(true)
        window.setTimeout(() => setShareCopied(false), 1800)
    }

    useEffect(() => {
        if (!id) return

        const fetchData = async () => {
            try {
                const [prodRes, eventsRes, genresRes, tagsRes] = await Promise.all([
                    getProductionById(id),
                    getEventsByProductionId(id),
                    getGenresByProductionId(id),
                    getTagsByProductionId(id),
                ])

                const prod = prodRes.data
                const now = Date.now()
                const pastEvents = eventsRes.data.filter((event) => {
                    if (!event.starts_at) return false
                    return new Date(event.starts_at).getTime() <= now
                })

                setProduction(prod)
                setEvents(pastEvents)
                setGenres(genresRes.data)
                setTags(tagsRes.data)

                if (prod.media_gallery_id) {
                    const galleryRes = await getGalleryItems(prod.media_gallery_id)
                    const items = galleryRes.data

                    if (items.length > 0) {
                        const firstCrops = await getItemCrops(items[0].id)
                        const heroUrl = getPreferredCropUrl(firstCrops.data)
                        setImageUrl(heroUrl)

                        // First item is used as the hero banner above; remaining items go in the gallery
                        const remainingItems = items.slice(1)
                        const allCrops = await Promise.all(remainingItems.map((item) => getItemCrops(item.id)))
                        setGalleryImages(allCrops.map((res) => getPreferredCropUrl(res.data)).filter(Boolean) as string[])
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
                setLoadError(true)
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
    const hasSidebar = Boolean(info) || genres.length > 0 || tags.length > 0
    const shareLabel = messages.search.shareLabel
    const shareCopiedLabel = messages.search.shareCopiedLabel

    const videos = [video1, video2]
        .filter(Boolean)
        .map((url) => getYouTubeEmbedUrl(url as string))
        .filter(Boolean)

    if (loadError) {
        return (
            <div className="site-container mt-8">
                <p className="text-sm text-text-accent">{messages.detail.loadError}</p>
            </div>
        )
    }

    return (
        <>
            <div className="site-container mt-8">
                <PublicPillButton
                    label={messages.detail.navBack}
                    onClick={handleGoBack}
                />
            </div>

            <div className="site-container mt-6">
                {imageUrl && (
                    <ArchiveDetailHero
                        imageUrl={imageUrl}
                        title={title}
                        superTitle={superTitle}
                        artist={artist}
                        genres={genres}
                        locale={locale}
                        shareLabel={shareCopied ? shareCopiedLabel : shareLabel}
                        onShare={() => {
                            void handleShare()
                        }}
                    />
                )}
            </div>

            <div className="site-container space-y-12 py-8">
                {teaser && (
                    <div className="max-w-5xl text-xl font-medium leading-relaxed text-text-accent md:text-2xl">
                        <div dangerouslySetInnerHTML={
                                { __html: formatHtml(teaser) }
                            } />
                    </div>
                )}

                {description && (
                    <div className="prose max-w-none prose-neutral text-base leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: formatHtml(description) }} />
                    </div>
                )}

                <div className="grid grid-cols-1 gap-9 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
                    <div className="space-y-9">
                        <section>
                            <h2 className="mb-6 text-3xl font-semibold tracking-tight md:text-4xl">
                                {messages.detail.events}
                            </h2>

                            <ArchiveDetailEventsList
                                events={events}
                                locationsByEvent={locationsByEvent}
                                locale={locale}
                            />
                        </section>

                        {videos.length > 0 && (
                            <section
                                className={`mx-auto gap-6 ${
                                    videos.length === 1
                                        ? 'max-w-3xl'
                                        : 'grid max-w-5xl grid-cols-1 md:grid-cols-2'
                                }`}
                            >
                                {videos.map((videoUrl, index) => (
                                    <div key={index} className="aspect-video w-full overflow-hidden rounded-xl">
                                        <iframe
                                            src={videoUrl!}
                                            title={`Video ${index + 1}`}
                                            className="h-full w-full"
                                            loading="lazy"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                ))}
                            </section>
                        )}

                        {quote && (
                            <blockquote className="rounded-xl border-l-4 border-accent bg-surface px-5 py-4 text-text-accent">
                                <div dangerouslySetInnerHTML={{ __html: quote.replace(/\r?\n/g, '<br />') }} />
                                {quoteSource && (
                                    <p className="mt-2 text-sm text-left">— {quoteSource}</p>
                                )}
                            </blockquote>
                        )}

                        {galleryImages.length > 0 && (
                            <ArchiveDetailGallery images={galleryImages} />
                        )}

                        {description2 && (
                            <div className="prose max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: description2.replace(/\r?\n/g, '<br />') }} />
                            </div>
                        )}
                    </div>

                    {hasSidebar ? (
                        <aside className="xl:sticky xl:top-22">
                            <div className="rounded-2xl border border-border bg-surface px-5 py-6">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-accent">
                                    {messages.detail.credits}
                                </h3>

                                {info ? (
                                    <div className="prose prose-sm mt-4 max-w-none text-text-accent">
                                        <div dangerouslySetInnerHTML={{ __html: info.replace(/\r?\n/g, '<br />') }} />
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-text-accent">-</p>
                                )}

                                {(genres.length > 0 || tags.length > 0) ? (
                                    <div className="mt-6 border-t border-border pt-4">
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-text-accent">
                                            Tags & genres
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {genres.map((genre) => {
                                                const name = localize(genre.name, locale)
                                                if (!name) return null
                                                return (
                                                    <span key={genre.id} className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
                                                        {name}
                                                    </span>
                                                )
                                            })}
                                            {tags.map((tag) => {
                                                const name = localize(tag.name, locale)
                                                if (!name) return null
                                                return (
                                                    <span key={tag.id} className="rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-foreground">
                                                        {name}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </aside>
                    ) : null}
                </div>

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
