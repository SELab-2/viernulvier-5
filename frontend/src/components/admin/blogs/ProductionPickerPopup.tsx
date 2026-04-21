import { getMessages } from '../../../i18n'


type LocalizedText = {
    nl?: string
    fr?: string
    en?: string
} | null

type ProductionItem = {
    id: string
    title: LocalizedText
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
    getProductionLabel: (production: ProductionItem) => string
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
    getProductionLabel,
}: ProductionPickerPopupProps) {
    if (!isOpen) {
        return null
    }

    const messages = getMessages();

    const limitedProductions = productions.slice(0, 100)
    const hasOptions = limitedProductions.length > 0

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

                    <select
                        value={selectedProductionId}
                        onChange={(event) => onSelect(event.target.value)}
                        disabled={!hasOptions || isLoading}
                        className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)]"
                    >
                        {hasOptions ? (
                            limitedProductions.map((production) => (
                                <option key={production.id} value={production.id}>
                                    {getProductionLabel(production)}
                                </option>
                            ))
                        ) : (
                            <option value="">{messages.blogs.productionPopUp.noProductionFound}</option>
                        )}
                    </select>
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
