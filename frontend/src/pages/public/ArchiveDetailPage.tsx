import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import { getActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'

type LocalizedText = {
    nl?: string
    en?: string
    fr?: string
} | null

type Production = {
    id: string
    title: LocalizedText
    teaser: LocalizedText
    description: LocalizedText
    description_short: LocalizedText
    artist: LocalizedText
    created_at: string
    links: {
        self: string
        events: string
        genres: string
        tags: string
        media_gallery: string | null
        poster_gallery: string | null
    }
}

type Genre = {
    id: string
    name: LocalizedText
}

type Tag = {
    id: string
    name: LocalizedText
}

type GalleryItem = {
    id: string
    link: string | null
    crops?: Array<{ name: string, url: string }>
    links?: {
        crops: string
    }
}

type Gallery = {
    id: string
    items: GalleryItem[]
}

function getLocalizedText(text: LocalizedText, locale: Locale): string {
    if (!text) return ''
    const values = locale === 'en' ? [text.en, text.nl, text.fr] : [text.nl, text.en, text.fr]
    return values.find(v => typeof v === 'string' && v.trim().length > 0) ?? ''
}

function getRelativePath(url: string | null | undefined): string | null {
    if (!url) return null
    const parts = url.split('/api/v1')
    return parts.length > 1 ? parts[1] : url
}

/**
 * Public archive detail page — shows a single archive item using RESTful links.
 */
function ArchiveDetailPage() {
    const { id } = useParams<{ id: string }>()
    const locale = getActiveLocale(window.location.pathname)
    
    const [production, setProduction] = useState<Production | null>(null)
    const [genres, setGenres] = useState<Genre[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [gallery, setGallery] = useState<Gallery | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchAllData() {
            setLoading(true)
            try {
                // 1. Fetch core production
                const prodResponse = await apiFetch<{ data: Production }>(`/archive/productions/${id}`)
                const prod = prodResponse.data
                setProduction(prod)

                // 2. Follow links for related data
                const genresPath = getRelativePath(prod.links.genres)
                const tagsPath = getRelativePath(prod.links.tags)
                const galleryPath = getRelativePath(prod.links.media_gallery)

                const [genresRes, tagsRes] = await Promise.allSettled([
                    genresPath ? apiFetch<{ data: Genre[] }>(genresPath) : Promise.reject('No genres link'),
                    tagsPath ? apiFetch<{ data: Tag[] }>(tagsPath) : Promise.reject('No tags link'),
                ])

                if (genresRes.status === 'fulfilled') setGenres(genresRes.value.data)
                if (tagsRes.status === 'fulfilled') setTags(tagsRes.value.data)

                if (galleryPath) {
                    try {
                        // 1. Production -> Gallery
                        const galRes = await apiFetch<{ data: { id: string, links: { items: string } } }>(galleryPath)
                        const itemsPath = getRelativePath(galRes.data?.links?.items)

                        if (itemsPath) {
                            // 2. Gallery -> Items
                            const itemsRes = await apiFetch<{ data: GalleryItem[] }>(itemsPath)
                            const firstItem = itemsRes.data?.[0]

                            if (firstItem && firstItem.links?.crops) {
                                // 3. Item -> Crops
                                const cropsPath = getRelativePath(firstItem.links.crops)
                                if (cropsPath) {
                                    const cropsRes = await apiFetch<{ data: Array<{ name: string, url: string }> }>(cropsPath)
                                    firstItem.crops = cropsRes.data
                                }
                            }
                            setGallery({ id: galRes.data.id, items: itemsRes.data })
                        }
                    } catch (galErr) {
                        // Silently fail gallery fetch
                    }
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data')
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchAllData()
    }, [id])

    if (loading) return <PublicLayout><div className="p-8 text-center">Laden...</div></PublicLayout>
    if (error || !production) return <PublicLayout><div className="p-8 text-center text-red-500">Error: {error || 'Niet gevonden'}</div></PublicLayout>

    const title = getLocalizedText(production.title, locale)
    const description = getLocalizedText(production.description, locale) || getLocalizedText(production.description_short, locale)
    const artist = getLocalizedText(production.artist, locale)

    const firstItemCrops = gallery?.items[0]?.crops
    const mainImage = firstItemCrops?.find(c => c.name === 'FE3_header')?.url 
        || firstItemCrops?.[0]?.url

    return (
        <PublicLayout>
            <main className="min-h-screen bg-white">
                {mainImage && (
                    <div className="w-full h-96 overflow-hidden relative">
                        <img src={mainImage} alt={title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30" />
                    </div>
                )}
                
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="mb-8">
                        <Link to={locale === 'nl' ? '/nl/zoeken' : '/en/search'} className="text-accent hover:underline mb-4 inline-block">
                            &larr; Terug naar zoeken
                        </Link>
                        <h1 className="text-5xl font-bold text-foreground mb-2">{title}</h1>
                        {artist && <p className="text-2xl text-muted">{artist}</p>}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {genres.map(g => (
                            <span key={g.id} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                                {getLocalizedText(g.name, locale)}
                            </span>
                        ))}
                        {tags.map(t => (
                            <span key={t.id} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                #{getLocalizedText(t.name, locale)}
                            </span>
                        ))}
                    </div>

                    <div 
                        className="prose prose-lg max-w-none text-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                </div>
            </main>
        </PublicLayout>
    )
}

export default ArchiveDetailPage
