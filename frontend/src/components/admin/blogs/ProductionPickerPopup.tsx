import { getMessages } from '../../../i18n'
import { toPlainText } from '../../../utils/text'


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
    if (!isOpen) {
        return null
    }

    const messages = getMessages();

    const limitedProductions = productions.slice(0, 100)
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
                        {hasOptions ? (
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
                                                {production.image_url ? (
                                                    <img
                                                        src={production.image_url}
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
