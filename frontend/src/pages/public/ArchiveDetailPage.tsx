import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getActiveLocale, getMessages, withLocalePath } from '../../i18n'
import PublicLayout from '../../components/public/PublicLayout'
import PublicPillButton from '../../components/public/PublicPillButton'
import { getProductionById, type Production } from '../../api/productions'
import { getGalleryItems, getItemCrops, getPreferredCropUrl } from '../../api/media'
import { getEventsByProductionId, type Event } from '../../api/events'

function ArchiveDetailPage() {
    const navigate = useNavigate()
    const locale = getActiveLocale(window.location.pathname)
    const messages = getMessages()
    const { id } = useParams<{ id: string }>()

    const [production, setProduction] = useState<Production | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [events, setEvents] = useState<Event[]>([])

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

            if (!prod.media_gallery_id) return
            getGalleryItems(prod.media_gallery_id).then((galleryRes) => {
                const firstItem = galleryRes.data[0]
                if (!firstItem) return
                getItemCrops(firstItem.id).then((cropsRes) => {
                    setImageUrl(getPreferredCropUrl(cropsRes.data))
                })
            })
        })

        getEventsByProductionId(id).then((res) => {
            setEvents(res.data)
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
                    <img
                        src={imageUrl}
                        alt={title || 'Production image'}
                        className="w-full h-[400px] object-cover rounded-xl"
                    />
                </div>
            )}

            <div className="site-container py-8">
                <h1 className="text-3xl font-bold mb-1">
                    {title || 'Untitled'}
                </h1>

                <h1 className="textarea mb-4">
                    {artist || 'Untitled'}
                </h1>

                <div className="prose max-w-none">
                    {description ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    ) : (
                        <p>No description available.</p>
                    )}
                </div>

                <div className="site-container py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4">messages.detail.dates</h2>
                        {events.length === 0 ? (
                            <p>No upcoming events.</p>
                        ) : (
                            <ul className="space-y-2">
                                {events.map((event) => (
                                    <li key={event.id}>
                                        {event.starts_at
                                            ? new Intl.DateTimeFormat(locale, {
                                                dateStyle: 'long',
                                                timeStyle: 'short',
                                            }).format(new Date(event.starts_at))
                                            : '—'}
                                    </li>
                                ))}
                            </ul>
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