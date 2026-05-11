import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { getMessages } from '../../i18n'

const MIN_PERIOD_YEAR = 1982
const MAX_PERIOD_YEAR = new Date().getFullYear()

export type HeroSearchFilters = {
    query: string
    yearFrom?: number
    yearTo?: number
    genre?: string
}

type FilterOption = {
    value: string
    label: string
}

type PublicHeroSearchProps = {
    initialFilters?: HeroSearchFilters
    onSearch?: (filters: HeroSearchFilters) => void
}

function SearchIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16L21 21" />
        </svg>
    )
}

function ChevronIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
            <path d="M7 10l5 5 5-5" />
        </svg>
    )
}

function SelectPill({
    label,
    value,
    options,
    onChange,
    disabled,
    className,
}: {
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
    disabled?: boolean
    className?: string
}) {
    return (
        <div className={`relative ${className ?? 'min-w-24'}`}>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                className="h-12 w-full appearance-none rounded-md bg-background pl-4 pr-12 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
                <option value="">{label}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
    )
}

function PublicHeroSearch({
    initialFilters,
    onSearch,
}: PublicHeroSearchProps) {
    const messages = usePublicMessages()
    const genreOptions = useMemo(
        () => messages.home.popularTags.map((tag) => ({ value: tag, label: tag })),
        [messages.home.popularTags]
    )

    const [query, setQuery] = useState(initialFilters?.query ?? '')
    const [yearFrom, setYearFrom] = useState(initialFilters?.yearFrom ?? MIN_PERIOD_YEAR)
    const [yearTo, setYearTo] = useState(initialFilters?.yearTo ?? MAX_PERIOD_YEAR)
    const [genre, setGenre] = useState(initialFilters?.genre ?? '')
    const [isYearOpen, setIsYearOpen] = useState(false)

    const sliderRef = useRef<HTMLDivElement | null>(null)
    const yearPillRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!isYearOpen) return
        const handleOutsideClick = (event: MouseEvent) => {
            if (yearPillRef.current && !yearPillRef.current.contains(event.target as Node)) {
                setIsYearOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [isYearOpen])

    const handleFromYearChange = (next: number) => {
        setYearFrom(Math.min(next, yearTo))
    }

    const handleToYearChange = (next: number) => {
        setYearTo(Math.max(next, yearFrom))
    }

    const handleSliderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        if (target.closest('input[type="range"]')) return

        const rect = sliderRef.current?.getBoundingClientRect()
        if (!rect || rect.width === 0) return

        const clickRatio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
        const yearRange = MAX_PERIOD_YEAR - MIN_PERIOD_YEAR
        const nextYear = Math.round(MIN_PERIOD_YEAR + clickRatio * yearRange)

        if (Math.abs(nextYear - yearFrom) <= Math.abs(nextYear - yearTo)) {
            handleFromYearChange(nextYear)
        } else {
            handleToYearChange(nextYear)
        }
    }

    const yearRange = MAX_PERIOD_YEAR - MIN_PERIOD_YEAR
    const fromPercent = ((yearFrom - MIN_PERIOD_YEAR) / yearRange) * 100
    const toPercent = ((yearTo - MIN_PERIOD_YEAR) / yearRange) * 100

    const isYearDefault = yearFrom === MIN_PERIOD_YEAR && yearTo === MAX_PERIOD_YEAR
    const yearLabel = isYearDefault ? messages.home.searchYear : `${yearFrom} – ${yearTo}`

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        onSearch?.({
            query: query.trim(),
            yearFrom: yearFrom > MIN_PERIOD_YEAR ? yearFrom : undefined,
            yearTo: yearTo < MAX_PERIOD_YEAR ? yearTo : undefined,
            genre: genre || undefined,
        })
    }

    return (
        <section className="relative overflow-hidden min-h-[63vh] flex flex-col justify-center pt-12 pb-0 md:pt-16">
            <img
                src="/background.svg"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full object-contain object-center max-w-[1280px] mx-auto left-0 right-0 hidden sm:block px-8 dark:invert"
            />
            <div className="pointer-events-none absolute -left-32 top-44 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 -top-8 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />

            <div className="site-container relative flex max-w-3xl flex-col items-center text-center">
                <p className="mb-8 text-sm font-regular tracking-wide text-accent bg-accent/10 py-2 px-4 rounded-full">
                    {messages.home.heroTagline}
                </p>

                <h1 className="text-4xl sm:text-5xl font-regular leading-tight text-text md:text-6xl">
                    <span>{messages.home.heroTitleTop}</span>
                    <br />
                    <span className="text-accent">{messages.home.heroTitleAccent}</span>
                    <span className="text-text"> {messages.home.heroTitleBottom}</span>
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="mt-10 w-full max-w-xl rounded-xl border border-border bg-surface p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:max-w-none"
                >
                    <div className="grid gap-2 md:grid-cols-[1.8fr_auto_auto_auto] md:items-center">
                        <div className="col-span-full flex h-12 items-center rounded-md bg-background px-4 text-muted md:col-span-1">
                            <SearchIcon className="mr-3 h-5 w-5" />
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={messages.nav.searchPlaceholder}
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                            />
                        </div>
                        <div className="col-span-full flex gap-2 pb-1 md:col-span-3 md:contents md:pb-0">
                            {/* Year range slider pill */}
                            <div ref={yearPillRef} className="relative min-w-0 flex-1 md:flex-none">
                                <button
                                    type="button"
                                    onClick={() => setIsYearOpen((open) => !open)}
                                    className="flex h-12 w-full items-center justify-between rounded-md bg-background pl-4 pr-4 text-sm font-semibold text-foreground md:min-w-36"
                                >
                                    <span className={isYearDefault ? 'text-muted' : 'text-foreground'}>{yearLabel}</span>
                                    <ChevronIcon className={`ml-2 h-4 w-4 shrink-0 text-muted transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isYearOpen && (
                                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-border bg-surface p-4 shadow-lg">
                                        <div ref={sliderRef} className="range-slider mt-1" onPointerDown={handleSliderPointerDown}>
                                            <div className="range-track" />
                                            <div className="range-track-active" style={{ left: `${fromPercent}%`, width: `${toPercent - fromPercent}%` }} />
                                            <input
                                                type="range"
                                                min={MIN_PERIOD_YEAR}
                                                max={MAX_PERIOD_YEAR}
                                                value={yearFrom}
                                                onChange={(event) => handleFromYearChange(Number(event.target.value))}
                                                className="range-input"
                                                aria-label="Start year"
                                            />
                                            <input
                                                type="range"
                                                min={MIN_PERIOD_YEAR}
                                                max={MAX_PERIOD_YEAR}
                                                value={yearTo}
                                                onChange={(event) => handleToYearChange(Number(event.target.value))}
                                                className="range-input"
                                                aria-label="End year"
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-muted">
                                            <span>{MIN_PERIOD_YEAR}</span>
                                            <span className="rounded-full bg-foreground px-2 py-0.5 font-semibold text-surface">
                                                {yearFrom} – {yearTo}
                                            </span>
                                            <span>{MAX_PERIOD_YEAR}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <SelectPill
                                className="min-w-0 flex-1 md:min-w-24 md:flex-none"
                                label={messages.home.searchGenre}
                                value={genre}
                                options={genreOptions}
                                onChange={setGenre}
                                disabled={genreOptions.length === 0}
                            />
                            <button
                                type="submit"
                                className="h-12 shrink-0 rounded-md bg-accent px-6 text-sm font-semibold text-white"
                            >
                                {messages.home.searchButton}
                            </button>
                        </div>
                    </div>
                </form>

                <p className="mt-8 pb-20 max-w-2xl text-sm leading-6 text-muted">{messages.home.intro}</p>
            </div>
        </section>
    )
}

export default PublicHeroSearch
