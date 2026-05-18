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
    selectedProductionIds: string[]
    searchQuery: string
    isLoading: boolean
    onClose: () => void
    onSelectedProductionIdsChange: (productionIds: string[]) => void
    onSearchQueryChange: (query: string) => void
    onAdd: (productionIds: string[]) => void
}

function ProductionPickerPopup({
    isOpen,
    productions,
    selectedProductionIds,
    searchQuery,
    isLoading,
    onClose,
    onSelectedProductionIdsChange,
    onSearchQueryChange,
    onAdd,
}: ProductionPickerPopupProps) {
    if (!isOpen) {
        return null
    }

    const messages = getMessages();

    const limitedProductions = productions.slice(0, 100)
    const hasOptions = limitedProductions.length > 0
    const selectedCount = selectedProductionIds.length
    const dialogTitleId = 'production-picker-title'

    const toggleProduction = (productionId: string) => {
        const nextSelection = selectedProductionIds.includes(productionId)
            ? selectedProductionIds.filter((id) => id !== productionId)
            : [...selectedProductionIds, productionId]

        onSelectedProductionIdsChange(nextSelection)
    }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-4 sm:px-6" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="border-b border-border bg-surface px-4 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 id={dialogTitleId} className="text-xl font-bold tracking-wide text-foreground sm:text-2xl">{messages.blogs.productionPopUp.title}</h3>
                            <p className="mt-1 text-sm text-muted">{messages.blogs.productionPopUp.selectedCount(selectedCount)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition hover:bg-background hover:text-foreground"
                        >
                            {messages.blogs.productionPopUp.close}
                        </button>
                    </div>

                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        placeholder={messages.blogs.productionPopUp.queryHint}
                        className="mt-4 w-full rounded-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                    />
                </div>

                <div className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                    {isLoading ? (
                        <div className="absolute inset-x-4 top-4 z-10 rounded-2xl border border-[var(--color-accent)]/30 bg-background/95 px-4 py-3 text-sm font-semibold text-foreground shadow-lg backdrop-blur sm:inset-x-6">
                            {messages.blogs.productionPopUp.loading}
                        </div>
                    ) : null}
                    {hasOptions ? (
                        <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isLoading ? 'pt-16 opacity-70' : ''}`}>
                            {limitedProductions.map((production) => {
                                const isSelected = selectedProductionIds.includes(production.id)

                                return (
                                    <button
                                        key={production.id}
                                        type="button"
                                        onClick={() => toggleProduction(production.id)}
                                        aria-pressed={isSelected}
                                        className={`group relative w-full overflow-hidden rounded-2xl border text-left transition duration-200 ${isSelected ? 'border-[var(--color-accent)] bg-surface shadow-lg shadow-black/10 ring-2 ring-[var(--color-accent)]/20' : 'border-border bg-background hover:-translate-y-0.5 hover:border-[var(--color-accent)]/50 hover:shadow-lg hover:shadow-black/10'}`}
                                    >
                                        <article className="flex h-full w-full flex-col p-3">
                                            <div className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent/50 sm:h-36">
                                                {production.image_url ? (
                                                    <img
                                                        src={production.image_url}
                                                        alt={getProductionLabel(production)}
                                                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : null}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                                                {isSelected ? (
                                                    <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-bold text-white shadow-lg">
                                                        ✓
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-accent">{getProductionDate(production)}</p>
                                            <h4 className="mt-1 line-clamp-2 text-lg leading-tight text-foreground [overflow-wrap:anywhere]">
                                                {getProductionDisplayTitle(production)}
                                            </h4>
                                            <p className="mt-2 line-clamp-3 text-sm text-text-accent">{getProductionExcerpt(production)}</p>
                                        </article>
                                    </button>
                                )
                            })}
                        </div>
                    ) : isLoading ? (
                        <p className="rounded-2xl border border-dashed border-[var(--color-accent)]/30 bg-surface px-4 py-8 text-center text-sm font-semibold text-foreground">
                            {messages.blogs.productionPopUp.loading}
                        </p>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-muted">
                            {messages.blogs.productionPopUp.noProductionFound}
                        </p>
                    )}
                </div>

                <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm text-muted">{messages.blogs.productionPopUp.readyCount(selectedCount)}</p>
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
                            onClick={() => onAdd(selectedProductionIds)}
                            disabled={selectedCount === 0 || !hasOptions || isLoading}
                            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {messages.blogs.productionPopUp.addButton}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductionPickerPopup
