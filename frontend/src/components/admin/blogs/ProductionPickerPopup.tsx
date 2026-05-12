import { getMessages } from '../../../i18n'
import { toPlainText } from '../../../utils/text'
import { useEffect, useState } from 'react'
import { apiFetch } from '../../../api/client'


type LocalizedText = {
    nl?: string
    fr?: string
    en?: string
} | null

type ProductionItem = {
    id: string
    title: LocalizedText
    artist?: LocalizedText
    description_short?: LocalizedText
    description?: LocalizedText
    teaser?: LocalizedText
    image_url?: string | null
    created_at?: string
    venue_name?: string | null
    venue_names?: string[]
    attendance_mode?: string | null
    links?: {
        media_gallery?: string | null
        poster_gallery?: string | null
    }
}

const getRelativePath = (url: string | null | undefined): string | null => {
    if (!url) return null
    const parts = url.split('/api/v1')
    return parts.length > 1 ? parts[1] : url
}

function useProductionImages(items: ProductionItem[]) {
    const [images, setImages] = useState<Record<string, string>>({})

    useEffect(() => {
        const abortController = new AbortController()

        const fetchImages = async () => {
            const itemsToFetch = items.filter(item => !item.image_url && (item.links?.media_gallery || item.links?.poster_gallery))
            if (itemsToFetch.length === 0) return

            const results = await Promise.allSettled(
                itemsToFetch.map(async (item) => {
                    const galleryUrl = item.links?.media_gallery ?? item.links?.poster_gallery
                    const galleryPath = getRelativePath(galleryUrl)
                    if (!galleryPath) return null

                    try {
                        const galleryRes = await apiFetch<{ data: { links: { items: string } } }>(galleryPath)
                        const itemsPath = getRelativePath(galleryRes.data?.links?.items)
                        if (!itemsPath) return null

                        const itemsRes = await apiFetch<{ data: Array<{ links?: { crops: string } }> }>(itemsPath)
                        for (const galleryItem of (itemsRes.data || [])) {
                            if (!galleryItem.links?.crops) continue
                            const cropsPath = getRelativePath(galleryItem.links.crops)
                            if (!cropsPath) continue
                            const cropsRes = await apiFetch<{ data: Array<{ name: string, url: string }> }>(cropsPath)
                            const target = cropsRes.data.find(c => c.name === 'FE3_header') || cropsRes.data.find(c => c.name === 'FEA_boxed') || cropsRes.data[0]
                            if (target?.url) return { id: item.id, url: target.url }
                        }
                    } catch {
                        return null
                    }

                    return null
                })
            )

            const newImages: Record<string, string> = {}
            results.forEach(res => { if (res.status === 'fulfilled' && res.value) newImages[res.value.id] = res.value.url })
            if (Object.keys(newImages).length > 0) setImages(prev => ({ ...prev, ...newImages }))
        }

        void fetchImages()

        return () => abortController.abort()
    }, [items])

    return images
}

type ProductionPickerPopupProps = {
    isOpen: boolean
    productions: ProductionItem[]
    selectedProductionId: string
    searchQuery: string
    isLoading: boolean
    onClose: () => void
    onSelect: (productionId: string) => void
    onSearchQueryChange: (query: string) => void
    onAdd: () => void
}

function ProductionPickerPopup({
    isOpen,
    productions,
    selectedProductionId,
    searchQuery,
    isLoading,
    onClose,
    onSelect,
    onSearchQueryChange,
    onAdd,
}: ProductionPickerPopupProps) {
    const limitedProductions = productions.slice(0, 25)
    const fetchedImages = useProductionImages(limitedProductions)
    if (!isOpen) {
        return null
    }

    const messages = getMessages();

    const hasOptions = limitedProductions.length > 0

    const getLocalizedText = (value: LocalizedText | undefined): string => {
        if (!value) {
            return ''
        }

        return value.nl ?? value.en ?? value.fr ?? ''
    }

    const getProductionLabel = (production: ProductionItem): string => {
        return getLocalizedText(production.title) || production.id
    }

    const getProductionDisplayTitle = (production: ProductionItem): string => {
        const title = getLocalizedText(production.title)
        const artist = getLocalizedText(production.artist)

        if (title && artist) {
            const normalizedTitle = title.trim().toLowerCase()
            const normalizedArtist = artist.trim().toLowerCase()

            if (normalizedTitle === normalizedArtist) {
                return title
            }

            return `${title} — ${artist}`
        }

        return title || artist || production.id
    }

    const getProductionExcerpt = (production: ProductionItem): string => {
        const raw = getLocalizedText(production.description_short) || getLocalizedText(production.description) || getLocalizedText(production.teaser)
        const fallback = getProductionLabel(production)
        const plain = toPlainText(raw || fallback)
        return plain.length > 140 ? `${plain.slice(0, 137)}...` : plain
    }

    const getProductionDate = (production: ProductionItem): string => {
        if (!production.created_at) {
            return ''
        }

        const date = new Date(production.created_at)
        if (Number.isNaN(date.getTime())) {
            return ''
        }

        return new Intl.DateTimeFormat(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-2xl border border-border bg-background p-6"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-wide text-foreground">{messages.blogs.productionPopUp.title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-muted transition hover:text-foreground"
                    >
                        {messages.blogs.productionPopUp.close}
                    </button>
                </div>

                <div className="mb-5">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        placeholder={messages.blogs.productionPopUp.queryHint}
                        className="mb-3 w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
                    />

                    <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                        {isLoading ? (
                            <p className="rounded-lg border border-border px-3 py-2 text-sm text-muted">
                                {messages.blogs.productionPopUp.loading}
                            </p>
                        ) : hasOptions ? (
                            limitedProductions.map((production) => {
                                const isSelected = production.id === selectedProductionId

                                return (
                                    <button
                                        key={production.id}
                                        type="button"
                                        onClick={() => onSelect(production.id)}
                                        className={`w-full rounded-xl border text-left transition ${isSelected ? 'border-[var(--color-accent)] bg-surface' : 'border-border bg-background hover:border-[var(--color-accent)]/50'}`}
                                    >
                                        <article className="flex w-full flex-col p-3">
                                            <div className="relative h-24 overflow-hidden rounded-md bg-gradient-to-br from-accent to-accent/50">
                                                {(fetchedImages[production.id] || production.image_url) ? (
                                                    <img
                                                        src={fetchedImages[production.id] || production.image_url || ''}
                                                        alt={getProductionLabel(production)}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : null}
                                                <div className="absolute inset-0 bg-black/20" />
                                            </div>
                                            <p className="mt-2 text-xs text-text-accent">{getProductionDate(production)}</p>
                                            <h4 className="mt-1 line-clamp-2 text-lg leading-tight text-foreground [overflow-wrap:anywhere]">
                                                {getProductionDisplayTitle(production)}
                                            </h4>
                                            <p className="mt-1 line-clamp-2 text-sm text-text-accent">{getProductionExcerpt(production)}</p>
                                        </article>
                                    </button>
                                )
                            })
                        ) : (
                            <p className="rounded-lg border border-border px-3 py-2 text-sm text-muted">
                                {messages.blogs.productionPopUp.noProductionFound}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-surface"
                    >
                        {messages.blogs.productionPopUp.close}
                    </button>
                    <button
                        type="button"
                        onClick={onAdd}
                        disabled={!selectedProductionId || !hasOptions || isLoading}
                        className="rounded-full bg-accent px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {messages.blogs.productionPopUp.addButton}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProductionPickerPopup
