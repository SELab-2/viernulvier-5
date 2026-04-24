import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch, normalizeApiAssetUrl } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import { getActiveLocale, withLocalePath } from '../../i18n'

type LocalizedText = {
    nl?: string
    en?: string
    fr?: string
} | null

type PosterDetail = {
    id: string
    title: string
    file_url: string
    mime_type: string | null
    production: {
        id: string
        title: string
    } | null
}

type PosterDetailResponse = {
    data: PosterDetail
}

type PosterListResponse = {
    data: PosterDetail[]
}

type ProductionPreview = {
    id: string
    title: LocalizedText
    image_url?: string | null
    created_at?: string
    production_genres?: string[]
}

type ProductionPreviewResponse = {
    data: ProductionPreview
}

function getLocalizedText(text: LocalizedText, locale: 'nl' | 'en'): string {
    if (!text) {
        return ''
    }

    const values = locale === 'en' ? [text.en, text.nl, text.fr] : [text.nl, text.en, text.fr]
    return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? ''
}

function PosterDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const locale = getActiveLocale(window.location.pathname)
    const [poster, setPoster] = useState<PosterDetail | null>(null)
    const [relatedPosters, setRelatedPosters] = useState<PosterDetail[]>([])
    const [relatedProduction, setRelatedProduction] = useState<ProductionPreview | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const productionId = searchParams.get('productionId')?.trim() || ''

    useEffect(() => {
        let isActive = true

        const loadPoster = async () => {
            if (!id) {
                setError(locale === 'en' ? 'Poster not found.' : 'Affiche niet gevonden.')
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError('')

            try {
                const response = await apiFetch<PosterDetailResponse>(`/archive/posters/${id}`)

                if (!isActive) {
                    return
                }

                setPoster(response.data)

                if (productionId) {
                    try {
                        const groupedResponse = await apiFetch<PosterListResponse>(
                            `/archive/posters?page=1&limit=100&productionId=${encodeURIComponent(productionId)}`,
                        )

                        if (isActive) {
                            setRelatedPosters(groupedResponse.data)
                        }
                    } catch {
                        if (isActive) {
                            setRelatedPosters([])
                        }
                    }
                } else if (isActive) {
                    setRelatedPosters([])
                }

                if (response.data.production?.id) {
                    try {
                        const productionResponse = await apiFetch<ProductionPreviewResponse>(
                            `/archive/productions/${response.data.production.id}`,
                        )

                        if (isActive) {
                            setRelatedProduction(productionResponse.data)
                        }
                    } catch {
                        if (isActive) {
                            setRelatedProduction(null)
                        }
                    }
                } else {
                    setRelatedProduction(null)
                }
            } catch (loadError) {
                if (!isActive) {
                    return
                }

                setError(loadError instanceof Error ? loadError.message : locale === 'en' ? 'Failed to load poster.' : 'Kon affiche niet laden.')
            } finally {
                if (isActive) {
                    setIsLoading(false)
                }
            }
        }

        void loadPoster()

        return () => {
            isActive = false
        }
    }, [id, locale, productionId])

    const backLabel = locale === 'en' ? 'Back to search' : 'Terug naar zoeken'
    const relatedProductionLabel = locale === 'en' ? 'Related' : 'Gerelateerd'
    const noLinkedProductionLabel = locale === 'en' ? 'No linked production' : 'Geen gekoppelde productie'

    const relatedTitle = relatedProduction
        ? getLocalizedText(relatedProduction.title, locale)
        : poster?.production?.title ?? ''

    const relatedYear = relatedProduction?.created_at
        ? new Date(relatedProduction.created_at).getFullYear()
        : undefined

    const relatedGenre = relatedProduction?.production_genres?.find((value) => value.trim().length > 0)

    const relatedItems = poster?.production
        ? [
              {
                  id: poster.production.id,
                  title: relatedTitle || poster.production.title,
                  imageUrl: relatedProduction?.image_url,
                  year: relatedYear,
                  genre: relatedGenre,
              },
          ]
        : []

    const displayPosters = relatedPosters.length > 0 ? relatedPosters : poster ? [poster] : []

    return (
        <PublicLayout>
            <section className="site-container py-12">
                <div className="mx-auto max-w-5xl">
                    <Link
                        to={withLocalePath('/zoeken', locale)}
                        className="mb-6 inline-block text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
                    >
                        {`← ${backLabel}`}
                    </Link>

                    {isLoading ? <p className="text-center text-muted">{locale === 'en' ? 'Loading poster...' : 'Affiche laden...'}</p> : null}
                    {error ? <p className="text-center text-red-500">{error}</p> : null}

                    {!isLoading && !error && poster ? (
                        <article className="space-y-8">
                            <header className="space-y-2">
                                <h1 className="text-4xl font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">{poster.title}</h1>
                            </header>

                            <div className="grid gap-4">
                                {displayPosters.map((asset) => (
                                    <div key={asset.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                                        <div className="flex min-h-[360px] items-center justify-center bg-black/5 p-4 md:min-h-[540px] md:p-6">
                                            {asset.mime_type === 'application/pdf' ? (
                                                <iframe
                                                    src={normalizeApiAssetUrl(asset.file_url)}
                                                    title={asset.title}
                                                    className="h-[70vh] w-full rounded-md border border-border"
                                                />
                                            ) : (
                                                <img
                                                    src={normalizeApiAssetUrl(asset.file_url)}
                                                    alt={asset.title}
                                                    className="max-h-[70vh] w-auto max-w-full object-contain"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <footer className="border-t border-border pt-5">
                                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-accent">
                                    {relatedProductionLabel}
                                </p>
                                {relatedItems.length > 0 ? (
                                    <div className="grid max-w-4xl gap-4 md:grid-cols-2">
                                        {relatedItems.map((item) => (
                                            <Link
                                                key={item.id}
                                                to={withLocalePath(`/archive/${item.id}`, locale)}
                                                className="group flex h-full min-h-[7.5rem] items-center gap-4 rounded-xl border border-border/80 bg-surface p-3 transition hover:border-[var(--color-accent)]/45 hover:bg-accent/5"
                                            >
                                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-accent/10">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={normalizeApiAssetUrl(item.imageUrl)}
                                                            alt={item.title}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-text-accent">
                                                            VIERNULVIER
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex flex-1 flex-col justify-center">
                                                    <p className="line-clamp-2 min-h-[3.25rem] text-2xl font-semibold leading-tight text-foreground [overflow-wrap:anywhere] group-hover:text-[var(--color-accent)]">
                                                        {item.title}
                                                    </p>
                                                    {item.year || item.genre ? (
                                                        <p className="mt-1 text-base text-text-accent">
                                                            {item.year ?? ''}
                                                            {item.year && item.genre ? ' • ' : ''}
                                                            {item.genre ?? ''}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-base text-muted">{noLinkedProductionLabel}</p>
                                )}
                            </footer>
                        </article>
                    ) : null}
                </div>
            </section>
        </PublicLayout>
    )
}

export default PosterDetailPage