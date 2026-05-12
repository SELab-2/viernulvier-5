import { Link } from 'react-router-dom'

const FALLBACK_IMAGE = '/fallback-hero.svg'

export type SearchResultItem = {
    id: string
    tag: string
    date: string
    title: string
    excerpt: string
    venue: string
    imageUrl?: string
    detailHref?: string
}

type SearchResultCardProps = {
    item: SearchResultItem
    detailHref: string
    onTagClick?: (genreValue: string) => void
    genreValue?: string
}

function capitalizeFirst(value: string): string {
    if (value.length === 0) return value
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function SearchResultCard({ item, detailHref, onTagClick, genreValue }: SearchResultCardProps) {
    const normalizedTitle = capitalizeFirst(item.title.trim())
    const displayTitle = normalizedTitle.length > 110 ? `${normalizedTitle.slice(0, 107)}...` : normalizedTitle
    const imageUrl = item.imageUrl ?? FALLBACK_IMAGE
    const effectiveGenreValue = (genreValue?.trim() || item.tag.trim())
    const hasClickableTag = typeof onTagClick === 'function' && effectiveGenreValue.length > 0

    return (
        <article className="relative flex w-full flex-col border-b border-border pb-5">
            {hasClickableTag ? (
                <button
                    type="button"
                    className="absolute left-3 top-3 z-10 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-xs font-semibold lowercase text-white backdrop-blur-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1"
                    onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onTagClick?.(effectiveGenreValue)
                    }}
                >
                    {item.tag}
                </button>
            ) : (
                <span className="absolute left-3 top-3 z-10 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-xs font-semibold lowercase text-white backdrop-blur-sm">
                    {item.tag}
                </span>
            )}

            <Link
                to={detailHref}
                className="group block h-full rounded-lg focus-visible:outline-none focus-visibIe:ring-2 focus-visibIe:ring-accent/50 focus-visibIe:ring-offset-2"
                aria-label={item.title}
            >
                <div className="relative h-32 overflow-hidden rounded-md sm:h-36 bg-gradient-to-br from-accent to-accent/50">
                    <img
                        src={imageUrl}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="flex flex-1 flex-col">
                    <p className="mt-3 text-xs text-text-accent">{item.date}</p>
                    <h3 className="mt-1 line-clamp-3 text-2xl leading-none text-foreground [overflow-wrap:anywhere] transition-colors group-hover:text-accent">
                        {displayTitle}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-accent">{item.excerpt}</p>
                    <p className="mt-auto pt-4 text-xs font-semibold lowercase tracking-wide text-text-accent">{item.venue}</p>
                </div>
            </Link>
        </article>
    )

}
export default SearchResultCard
