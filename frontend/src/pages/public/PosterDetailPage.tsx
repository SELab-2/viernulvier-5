import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch, normalizeApiAssetUrl } from '../../api/client'
import PublicLayout from '../../components/public/PublicLayout'
import { getActiveLocale, withLocalePath } from '../../i18n'
import type { Locale } from '../../i18n/types'
import { usePublicMessages } from '../../components/public/PublicMessagesContext'

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
    files?: Array<{
        id: string
        file_url: string
        mime_type: string | null
    }>
    production: {
        id: string
        title: string
    } | null
    productions?: Array<{
        id: string
        title: string
    }>
}

type PosterDetailResponse = {
    data: PosterDetail
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
    const locale = getActiveLocale(window.location.pathname)

    return (
        <PublicLayout>
            <PosterDetailPageContent id={id ?? ''} locale={locale} />
        </PublicLayout>
    )
}

function PosterDetailPageContent({
    id,
    locale,
}: {
    id: string
    locale: Locale
}) {
    const { detail: detailMessages } = usePublicMessages()
    const [poster, setPoster] = useState<PosterDetail | null>(null)
    const [relatedProductions, setRelatedProductions] = useState<ProductionPreview[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let isActive = true

        const loadPoster = async () => {
            if (!id) {
                setError(detailMessages.posterNotFound)
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

                const productionRefs = response.data.productions?.length
                    ? response.data.productions
                    : response.data.production
                        ? [response.data.production]
                        : []

                if (productionRefs.length > 0) {
                    try {
                        const results = await Promise.allSettled(
                            productionRefs.map((ref) => apiFetch<ProductionPreviewResponse>(`/archive/productions/${ref.id}`)),
                        )

                        if (isActive) {
                            const previews = results.flatMap((result) =>
                                result.status === 'fulfilled' ? [result.value.data] : [],
                            )
                            setRelatedProductions(previews)
                        }
                    } catch {
                        if (isActive) {
                            setRelatedProductions([])
                        }
                    }
                } else if (isActive) {
                    setRelatedProductions([])
                }
            } catch (loadError) {
                if (!isActive) {
                    return
                }

                setError(loadError instanceof Error ? loadError.message : detailMessages.posterLoadError)
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
    }, [id, locale, detailMessages])

    const backLabel = detailMessages.backToSearch
    const relatedProductionLabel = detailMessages.relatedProductions

    const relatedItems = (() => {
        if (!poster) {
            return []
        }

        const refs = poster.productions?.length
            ? poster.productions
            : poster.production
                ? [poster.production]
                : []

        return refs.map((ref) => {
            const preview = relatedProductions.find((item) => item.id === ref.id)
            const normalizedLocale = locale === 'en' ? 'en' : 'nl'
            const title = preview ? getLocalizedText(preview.title, normalizedLocale) : ''
            const year = preview?.created_at ? new Date(preview.created_at).getFullYear() : undefined
            const genre = preview?.production_genres?.find((value) => value.trim().length > 0)

            return {
                id: ref.id,
                title: title || ref.title,
                imageUrl: preview?.image_url,
                year,
                genre,
            }
        })
    })()

    const displayPosters = poster?.files?.length
        ? poster.files
        : poster
            ? [{ id: poster.id, file_url: poster.file_url, mime_type: poster.mime_type }]
            : []

    const resolvedPosterAssets = displayPosters
        .map((asset) => ({
            ...asset,
            resolvedUrl: normalizeApiAssetUrl(asset.file_url) ?? asset.file_url,
        }))
        .filter((asset) => typeof asset.resolvedUrl === 'string' && asset.resolvedUrl.trim().length > 0)

    const hasValidAssets = resolvedPosterAssets.length > 0

    return (
        <section className="site-container py-12">
            <div className="mx-auto max-w-5xl">
                <Link
                    to={withLocalePath('/zoeken', locale)}
                    className="mb-6 inline-block text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
                >
                    {`← ${backLabel}`}
                </Link>

                {isLoading ? <p className="text-center text-muted">{detailMessages.loadingPoster}</p> : null}
                {error ? <p className="text-center text-red-500">{error}</p> : null}

                {!isLoading && !error && poster ? (
                    <article className="space-y-8">
                        <header className="space-y-2">
                            <h1 className="text-4xl font-semibold leading-tight text-foreground [overflow-wrap:anywhere]">{poster.title}</h1>
                        </header>

                        {hasValidAssets ? (
                            <div className="grid gap-4">
                                {resolvedPosterAssets.map((asset) => (
                                    <div key={asset.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                                        <div className="flex items-center justify-center p-2 md:p-4">
                                            {asset.mime_type === 'application/pdf' ? (
                                                <iframe
                                                    src={asset.resolvedUrl}
                                                    title={poster.title}
                                                    className="h-[80vh] w-full rounded-md border border-border"
                                                />
                                            ) : (
                                                <img
                                                    src={asset.resolvedUrl}
                                                    alt={poster.title}
                                                    className="h-auto w-auto max-h-[80vh] max-w-full object-contain"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border bg-surface-sunken p-8 text-center">
                                <p className="text-muted">{detailMessages.posterLoadError}</p>
                            </div>
                        )}

                        {relatedItems.length > 0 ? (
                            <footer className="border-t border-border pt-5">
                                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-accent">
                                    {relatedProductionLabel}
                                </p>
                                <div className="grid w-full gap-4 md:grid-cols-2">
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
                            </footer>
                        ) : null}
                    </article>
                    ) : null}
                </div>
            </section>
    )
}

export default PosterDetailPage