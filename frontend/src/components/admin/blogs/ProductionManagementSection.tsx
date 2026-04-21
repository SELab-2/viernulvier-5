import ProductionPickerPopup from './ProductionPickerPopup'
import { getMessages } from '../../../i18n'

type LocalizedText = {
    nl?: string
    fr?: string
    en?: string
} | null

export type ProductionItem = {
    id: string
    title: LocalizedText
}

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
    getProductionLabel: (production: ProductionItem) => string
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
    getProductionLabel,
}: ProductionManagementSectionProps) {

    const messages = getMessages();

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
                                disabled={isLoadingProductions || availableProductions.length === 0}
                                className="mb-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {messages.blogs.manageProduction}
                            </button>

                            {selectedProductions.length === 0 ? (
                                <p className="mb-4 text-sm text-muted">
                                    {messages.blogs.manageProductionButton}
                                </p>
                            ) : (
                                <ul className="mb-4 space-y-2">
                                    {selectedProductions.map((production) => (
                                        <li
                                            key={production.id}
                                            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground flex justify-between items-center"
                                        >
                                            <span>{getProductionLabel(production)}</span>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveProduction(production.id)}
                                                aria-label="Verwijder productie"
                                                className="ml-2 text-muted transition hover:text-red-600"
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
                                        </li>
                                    ))}
                                </ul>
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
                productions={availableProductions}
                selectedProductionId={productionToAdd}
                searchQuery={productionSearchQuery}
                isLoading={isLoadingProductions}
                onClose={onClosePopup}
                onSelect={onSelectProductionToAdd}
                onSearchQueryChange={onProductionSearchQueryChange}
                onAdd={onAddProduction}
                getProductionLabel={getProductionLabel}
            />
        </>
    )
}

export default ProductionManagementSection
