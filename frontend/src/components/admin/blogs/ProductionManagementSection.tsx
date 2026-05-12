import { useEffect, useMemo, useState } from 'react'
import { getActiveLocale, getMessages } from '../../../i18n'
import { apiFetch } from '../../../api/client'
import ProductionCard, { type ProductionCardItem } from '../../blogs/ProductionCard'
import ProductionPickerPopup from './ProductionPickerPopup'

export type ProductionItem = ProductionCardItem

type GalleryResponse = {
    data: {
        links?: {
            items?: string
        }
    }
}

type GalleryItemsResponse = {
    data: Array<{
        links?: {
            crops?: string
        }
    }>
}

type CropResponse = {
    data: Array<{
        name: string
        url: string
    }>
}


/*
This section will display selected productions, is able to remove production and select production (by starting a popup)
*/

type ProductionManagementSectionProps = {
    selectedProductions: ProductionItem[]
    availableProductions: ProductionItem[]
    productionToAdd: string
    productionSearchQuery: string
    isProductionPopupOpen: boolean
    isLoadingProductions: boolean
    productionsError: string
    onOpenPopup: () => void
    onClosePopup: () => void
    onSelectProductionToAdd: (productionId: string) => void
    onProductionSearchQueryChange: (query: string) => void
    onAddProduction: () => void
    onRemoveProduction: (productionId: string) => void
}

function ProductionManagementSection({
    selectedProductions,
    availableProductions,
    productionToAdd,
    productionSearchQuery,
    isProductionPopupOpen,
    isLoadingProductions,
    productionsError,
    onOpenPopup,
    onClosePopup,
    onSelectProductionToAdd,
    onProductionSearchQueryChange,
    onAddProduction,
    onRemoveProduction,
}: ProductionManagementSectionProps) {
    const locale = getActiveLocale(window.location.pathname)
    const messages = getMessages(locale)

    const getRelativePath = (url: string | null | undefined): string | null => {
        if (!url) {
            return null
        }

        const parts = url.split('/api/v1')
        return parts.length > 1 ? parts[1] : url
    }

    const [imageUrls, setImageUrls] = useState<Record<string, string>>({})

    useEffect(() => {
        const abortController = new AbortController()

        const fetchProductionImages = async () => {
            const candidates = [...selectedProductions, ...availableProductions].filter(
                (production) => !production.image_url && (production.poster_gallery_id || production.media_gallery_id),
            )

            if (candidates.length === 0) {
                return
            }

            const results = await Promise.allSettled(
                candidates.map(async (production) => {
                    const galleryId = production.poster_gallery_id ?? production.media_gallery_id
                    if (!galleryId) {
                        return null
                    }

                    const galleryRes = await apiFetch<GalleryResponse>(`/archive/media/galleries/${galleryId}`, {
                        signal: abortController.signal,
                    })
                    const itemsPath = getRelativePath(galleryRes.data?.links?.items)
                    if (!itemsPath) {
                        return null
                    }

                    const itemsRes = await apiFetch<GalleryItemsResponse>(itemsPath, {
                        signal: abortController.signal,
                    })

                    for (const galleryItem of itemsRes.data ?? []) {
                        const cropsPath = getRelativePath(galleryItem.links?.crops)
                        if (!cropsPath) {
                            continue
                        }

                        const cropsRes = await apiFetch<CropResponse>(cropsPath, {
                            signal: abortController.signal,
                        })

                        const targetCrop =
                            cropsRes.data.find((crop) => crop.name === 'FE3_header')
                            ?? cropsRes.data.find((crop) => crop.name === 'FEA_boxed')
                            ?? cropsRes.data[0]

                        if (targetCrop?.url) {
                            return { id: production.id, url: targetCrop.url }
                        }
                    }

                    return null
                }),
            )

            if (abortController.signal.aborted) {
                return
            }

            const nextImageUrls: Record<string, string> = {}
            results.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    nextImageUrls[result.value.id] = result.value.url
                }
            })

            if (Object.keys(nextImageUrls).length > 0) {
                setImageUrls((current) => ({ ...current, ...nextImageUrls }))
            }
        }

        void fetchProductionImages()

        return () => {
            abortController.abort()
        }
    }, [availableProductions, selectedProductions])

    const productionsWithImages = useMemo(
        () =>
            [...selectedProductions, ...availableProductions].map((production) => ({
                ...production,
                image_url: production.image_url ?? imageUrls[production.id] ?? null,
            })),
        [availableProductions, imageUrls, selectedProductions],
    )

    const selectedProductionsWithImages = useMemo(
        () => productionsWithImages.filter((production) => selectedProductions.some((item) => item.id === production.id)),
        [productionsWithImages, selectedProductions],
    )

    const availableProductionsWithImages = useMemo(
        () => productionsWithImages.filter((production) => availableProductions.some((item) => item.id === production.id)),
        [availableProductions, productionsWithImages],
    )

    return (
        <>
            <section className="relative px-4 py-4 overflow-hidden">
                <div className="px-4 py-4 relative flex flex-col">
                    <div className="rounded-xl border border-border bg-background">
                        <div className="bg-surface rounded-xl p-4">
                            <h2 className="mb-4 text-lg font-semibold text-foreground">{messages.blogs.manageProduction}</h2>

                            <button
                                type="button"
                                onClick={onOpenPopup}
                                className="mb-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {messages.blogs.manageProduction}
                            </button>

                            {selectedProductions.length === 0 ? (
                                <p className="mb-4 text-sm text-muted">
                                    {messages.blogs.manageProductionButton}
                                </p>
                            ) : (
                                <div className="mb-4 overflow-x-auto pb-2">
                                    <ul className="flex min-w-max gap-3">
                                        {selectedProductionsWithImages.map((production) => (
                                            <li
                                                key={production.id}
                                                className="list-none shrink-0 w-[320px]"
                                            >
                                                <ProductionCard
                                                    production={production}
                                                    locale={locale}
                                                    selected
                                                    className="overflow-hidden"
                                                    action={
                                                        <button
                                                            type="button"
                                                            onClick={() => onRemoveProduction(production.id)}
                                                            aria-label={messages.blogs.removeProductionAriaLabel}
                                                            className="rounded-full border border-border bg-background/90 p-2 text-muted transition hover:border-red-500 hover:text-red-600"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="18"
                                                                height="18"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="lucide lucide-trash2-icon lucide-trash-2"
                                                            >
                                                                <path d="M10 11v6" />
                                                                <path d="M14 11v6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                                <path d="M3 6h18" />
                                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    }
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {productionsError ? (
                                <p className="mt-3 text-sm text-red-500">{productionsError}</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            <ProductionPickerPopup
                isOpen={isProductionPopupOpen}
                productions={availableProductionsWithImages}
                selectedProductionId={productionToAdd}
                searchQuery={productionSearchQuery}
                isLoading={isLoadingProductions}
                onClose={onClosePopup}
                onSelect={onSelectProductionToAdd}
                onSearchQueryChange={onProductionSearchQueryChange}
                onAdd={onAddProduction}
            />
        </>
    )
}

export default ProductionManagementSection
