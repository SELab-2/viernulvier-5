import { useMemo, useState, type FormEvent } from 'react'

export type HeroSearchFilters = {
    query: string
    year?: string
    genre?: string
    location?: string
}

type FilterOption = {
    value: string
    label: string
}

type PublicHeroSearchProps = {
    heroTagline: string
    titleTop: string
    titleAccent: string
    titleBottom: string
    intro: string
    searchPlaceholder: string
    searchYearLabel: string
    searchGenreLabel: string
    searchLocationLabel: string
    searchButtonLabel: string
    yearOptions?: FilterOption[]
    genreOptions?: FilterOption[]
    locationOptions?: FilterOption[]
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
}: {
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
    disabled?: boolean
}) {
    return (
        <div className="relative min-w-24">
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                className="h-12 w-full appearance-none rounded-md bg-background pl-4 pr-12 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-70"
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
    heroTagline,
    titleTop,
    titleAccent,
    titleBottom,
    intro,
    searchPlaceholder,
    searchYearLabel,
    searchGenreLabel,
    searchLocationLabel,
    searchButtonLabel,
    yearOptions,
    genreOptions = [],
    locationOptions = [],
    onSearch,
}: PublicHeroSearchProps) {
    const [query, setQuery] = useState('')
    const [year, setYear] = useState('')
    const [genre, setGenre] = useState('')
    const [location, setLocation] = useState('')

    const defaultYearOptions = useMemo<FilterOption[]>(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: 41 }, (_, index) => {
            const optionYear = currentYear - index
            return { value: String(optionYear), label: String(optionYear) }
        })
    }, [])

    const effectiveYearOptions = yearOptions ?? defaultYearOptions

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        onSearch?.({
            query: query.trim(),
            year: year || undefined,
            genre: genre || undefined,
            location: location || undefined,
        })
    }

    return (
        <section className="relative overflow-hidden py-12 md:py-16">
            <div className="pointer-events-none absolute -left-32 top-44 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 -top-8 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />

            <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-3 text-center sm:px-4 md:px-0">
                <p className="mb-8 text-sm font-regular tracking-wide text-accent bg-accent/10 py-2 px-4 rounded-full">
                    {heroTagline}
                </p>

                <h1 className="text-5xl font-regular leading-tight text-muted md:text-6xl">
                    <span>{titleTop}</span>
                    <br />
                    <span className="text-accent">{titleAccent}</span>
                    <span className="text-muted"> {titleBottom}</span>
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="mt-10 w-full max-w-xl rounded-xl border border-border bg-surface p-2 shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:max-w-none"
                >
                    <div className="grid gap-2 md:grid-cols-[1.8fr_auto_auto_auto_auto]">
                        <div className="flex h-12 items-center rounded-md bg-background px-4 text-muted">
                            <SearchIcon className="mr-3 h-5 w-5" />
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
                            />
                        </div>
                        <SelectPill
                            label={searchYearLabel}
                            value={year}
                            options={effectiveYearOptions}
                            onChange={setYear}
                        />
                        <SelectPill
                            label={searchGenreLabel}
                            value={genre}
                            options={genreOptions}
                            onChange={setGenre}
                            disabled={genreOptions.length === 0}
                        />
                        <SelectPill
                            label={searchLocationLabel}
                            value={location}
                            options={locationOptions}
                            onChange={setLocation}
                            disabled={locationOptions.length === 0}
                        />
                        <button
                            type="submit"
                            className="h-12 w-full rounded-md bg-accent px-6 text-sm font-semibold text-white md:w-auto"
                        >
                            {searchButtonLabel}
                        </button>
                    </div>
                </form>

                <p className="mt-8 max-w-2xl text-sm leading-6 text-muted">{intro}</p>
            </div>
        </section>
    )
}

export default PublicHeroSearch
