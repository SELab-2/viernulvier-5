import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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

const MIN_PERIOD_YEAR = 1982
const MAX_PERIOD_YEAR = new Date().getFullYear()

export type ProductionPickerFilters = {
    yearFrom: number
    yearTo: number
    location: string
}

type ProductionPickerPopupProps = {
    isOpen: boolean
    productions: ProductionItem[]
    selectedProductionIds: string[]
    searchQuery: string
    filters: ProductionPickerFilters
    isLoading: boolean
    hasMoreProductions: boolean
    onLoadMoreProductions: () => void
    onClose: () => void
    onSelectedProductionIdsChange: (productionIds: string[]) => void
    onSearchQueryChange: (query: string) => void
    onFiltersChange: (filters: ProductionPickerFilters) => void
    onAdd: (productionIds: string[]) => void
}

function ProductionPickerPopup({
    isOpen,
    productions,
    selectedProductionIds,
    searchQuery,
    filters,
    isLoading,
    hasMoreProductions,
    onLoadMoreProductions,
    onClose,
    onSelectedProductionIdsChange,
    onSearchQueryChange,
    onFiltersChange,
    onAdd,
}: ProductionPickerPopupProps) {
    const messages = getMessages();

    const [areFiltersOpen, setAreFiltersOpen] = useState(false)
    const [isLocationSuggestionsOpen, setIsLocationSuggestionsOpen] = useState(false)
    const selectedCount = selectedProductionIds.length
    const dialogTitleId = 'production-picker-title'
    const sliderRef = useRef<HTMLDivElement | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement | null>(null)

    const updateFilters = (nextFilters: Partial<ProductionPickerFilters>) => {
        onFiltersChange({ ...filters, ...nextFilters })
    }

    const handleResultsScroll = () => {
        const container = scrollContainerRef.current
        if (!container || isLoading || !hasMoreProductions) {
            return
        }

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
        if (distanceFromBottom <= 160) {
            onLoadMoreProductions()
        }
    }

    const toggleProduction = (productionId: string) => {
        const nextSelection = selectedProductionIds.includes(productionId)
            ? selectedProductionIds.filter((id) => id !== productionId)
            : Array.from(new Set([...selectedProductionIds, productionId]))

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

    const getProductionLocations = (production: ProductionItem): string[] => {
        const locations = [
            ...(production.venue_names ?? []),
            production.venue_name ?? '',
            production.attendance_mode ?? '',
        ]
            .map((location) => location.trim())
            .filter(Boolean)

        return Array.from(new Set(locations))
    }

    const locationOptions = useMemo(() => {
        const locations = productions.flatMap(getProductionLocations)
        return Array.from(new Set(locations)).sort((first, second) => first.localeCompare(second))
    }, [productions])

    const normalizeLocationMatch = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '')
    const normalizedLocationInput = normalizeLocationMatch(filters.location)
    const locationSuggestionItems = useMemo(() => {
        if (!normalizedLocationInput) {
            return locationOptions.slice(0, 8)
        }

        return locationOptions
            .filter((location) => normalizeLocationMatch(location).includes(normalizedLocationInput))
            .slice(0, 8)
    }, [locationOptions, normalizedLocationInput])

    const yearRange = MAX_PERIOD_YEAR - MIN_PERIOD_YEAR
    const fromPercent = ((filters.yearFrom - MIN_PERIOD_YEAR) / yearRange) * 100
    const toPercent = ((filters.yearTo - MIN_PERIOD_YEAR) / yearRange) * 100

    const handleSliderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        if (target.closest('input[type="range"]')) {
            return
        }

        const rect = sliderRef.current?.getBoundingClientRect()
        if (!rect || rect.width === 0) {
            return
        }

        const clickRatio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
        const nextYear = Math.round(MIN_PERIOD_YEAR + clickRatio * yearRange)

        if (Math.abs(nextYear - filters.yearFrom) <= Math.abs(nextYear - filters.yearTo)) {
            updateFilters({ yearFrom: Math.min(nextYear, filters.yearTo) })
            return
        }

        updateFilters({ yearTo: Math.max(nextYear, filters.yearFrom) })
    }

    const hasOptions = productions.length > 0

    if (!isOpen) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 py-4 sm:px-6">
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

                    <div className="mt-4 flex gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => onSearchQueryChange(event.target.value)}
                            placeholder={messages.blogs.productionPopUp.queryHint}
                            className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                        />

                        <button
                            type="button"
                            onClick={() => setAreFiltersOpen((current) => !current)}
                            className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface"
                            aria-expanded={areFiltersOpen}
                        >
                            {messages.blogs.productionPopUp.filtersLabel}
                        </button>
                    </div>

                    {areFiltersOpen ? (
                        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
                            <div className="rounded-2xl border border-border bg-background p-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-text-accent">
                                    <span>{messages.blogs.productionPopUp.periodLabel}</span>
                                    <span className="rounded-full bg-surface px-2 py-1 text-foreground">{filters.yearFrom} - {filters.yearTo}</span>
                                </div>
                                <div ref={sliderRef} className="range-slider production-picker-range mt-5" onPointerDown={handleSliderPointerDown}>
                                    <div className="range-track" />
                                    <div className="range-track-active" style={{ left: `${fromPercent}%`, width: `${toPercent - fromPercent}%` }} />
                                    <input
                                        type="range"
                                        min={MIN_PERIOD_YEAR}
                                        max={MAX_PERIOD_YEAR}
                                        value={filters.yearFrom}
                                        onChange={(event) => updateFilters({ yearFrom: Math.min(Number(event.target.value), filters.yearTo) })}
                                        className="range-input"
                                        aria-label="Start year"
                                    />
                                    <input
                                        type="range"
                                        min={MIN_PERIOD_YEAR}
                                        max={MAX_PERIOD_YEAR}
                                        value={filters.yearTo}
                                        onChange={(event) => updateFilters({ yearTo: Math.max(Number(event.target.value), filters.yearFrom) })}
                                        className="range-input"
                                        aria-label="End year"
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                                    <span>{MIN_PERIOD_YEAR}</span>
                                    <span>{MAX_PERIOD_YEAR}</span>
                                </div>
                            </div>
                            <label className="relative rounded-2xl border border-border bg-background p-4 text-xs font-semibold uppercase tracking-wide text-text-accent">
                                {messages.blogs.productionPopUp.locationLabel}
                                <input
                                    type="text"
                                    value={filters.location}
                                    onChange={(event) => {
                                        updateFilters({ location: event.target.value })
                                        setIsLocationSuggestionsOpen(true)
                                    }}
                                    onFocus={() => setIsLocationSuggestionsOpen(true)}
                                    onBlur={() => {
                                        window.setTimeout(() => setIsLocationSuggestionsOpen(false), 120)
                                    }}
                                    placeholder={messages.blogs.productionPopUp.locationPlaceholder}
                                    className="mt-3 w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                                />
                                {isLocationSuggestionsOpen && locationSuggestionItems.length > 0 ? (
                                    <div className="absolute left-4 right-4 top-[calc(100%-0.75rem)] z-20 max-h-52 overflow-auto rounded-2xl border border-border bg-surface p-1 shadow-lg">
                                        {locationSuggestionItems.map((location) => (
                                            <button
                                                key={location}
                                                type="button"
                                                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-normal normal-case tracking-normal text-foreground transition-colors hover:bg-accent/10"
                                                onMouseDown={(event) => event.preventDefault()}
                                                onClick={() => {
                                                    updateFilters({ location })
                                                    setIsLocationSuggestionsOpen(false)
                                                }}
                                            >
                                                {location}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </label>
                        </div>
                    ) : null}
                </div>

                <div
                    ref={scrollContainerRef}
                    onScroll={handleResultsScroll}
                    className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
                >
                    {isLoading && hasOptions ? (
                        <div className="absolute inset-x-4 top-4 z-10 rounded-2xl border border-[var(--color-accent)]/30 bg-background/95 px-4 py-3 text-sm font-semibold text-foreground shadow-lg backdrop-blur sm:inset-x-6">
                            {messages.blogs.productionPopUp.loading}
                        </div>
                    ) : null}
                    {hasOptions ? (
                        <>
                        <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isLoading ? 'pt-16 opacity-70' : ''}`}>
                            {productions.map((production) => {
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
                        {isLoading && hasMoreProductions ? (
                            <p className="mt-4 rounded-2xl border border-dashed border-[var(--color-accent)]/30 bg-surface px-4 py-4 text-center text-sm font-semibold text-foreground">
                                {messages.blogs.productionPopUp.loadingMore}
                            </p>
                        ) : null}
                        </>
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
