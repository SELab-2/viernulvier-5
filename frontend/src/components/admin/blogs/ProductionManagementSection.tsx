import { useMemo } from 'react'
import { getActiveLocale, getMessages } from '../../../i18n'
import ProductionCard, { type ProductionCardItem } from '../../blogs/ProductionCard'
import ProductionPickerPopup from './ProductionPickerPopup'
import { useProductionImages } from '../hooks/useProductionImages'

export type ProductionItem = ProductionCardItem


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

    const mergedProductions = [...selectedProductions, ...availableProductions]
    const uniqueById = new Map(mergedProductions.map((production) => [production.id, production]))
    const allUniqueProductions = [...uniqueById.values()].map((production) => ({
        ...production,
        links: {
            media_gallery: production.media_gallery_id ? `/archive/media/galleries/${production.media_gallery_id}` : undefined,
            poster_gallery: production.poster_gallery_id ? `/archive/media/galleries/${production.poster_gallery_id}` : undefined,
        },
    }))

    const imageUrls = useProductionImages(allUniqueProductions)

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
