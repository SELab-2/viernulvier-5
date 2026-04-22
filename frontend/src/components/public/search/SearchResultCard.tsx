import { Link } from 'react-router-dom'

export type SearchResultItem = {
    id: string
    tag: string
    date: string
    title: string
    excerpt: string
    venue: string
    imageUrl?: string
}

type SearchResultCardProps = {
    item: SearchResultItem
    detailHref: string
}

function capitalizeFirst(value: string): string {
    if (value.length === 0) {
        return value
    }

    return value.charAt(0).toUpperCase() + value.slice(1)
}

function SearchResultCard({ item, detailHref }: SearchResultCardProps) {
    const normalizedTitle = capitalizeFirst(item.title.trim())
    const displayTitle = normalizedTitle.length > 110 ? `${normalizedTitle.slice(0, 107)}...` : normalizedTitle

    return (
        <Link
            to={detailHref}
            className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
            aria-label={item.title}
        >
            <article className="flex h-full w-full flex-col border-b border-border pb-5 transition-transform duration-200 group-hover:-translate-y-0.5">
                <div className="relative h-32 overflow-hidden rounded-md bg-gradient-to-br from-accent to-accent/50 sm:h-36">
                    {item.imageUrl ? (
                        <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                    ) : null}
                    <div className="absolute inset-0 bg-black/20" />
                    <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-xs font-semibold lowercase text-white backdrop-blur-sm">
                        {item.tag}
                    </span>
                </div>
                <div className="flex flex-1 flex-col">
                    <p className="mt-3 text-xs text-text-accent">{item.date}</p>
                    <h3 className="mt-1 line-clamp-3 text-2xl leading-none text-foreground [overflow-wrap:anywhere] transition-colors group-hover:text-accent">
                        {displayTitle}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-accent">{item.excerpt}</p>
                    <p className="mt-auto pt-4 text-xs font-semibold lowercase tracking-wide text-text-accent">{item.venue}</p>
                </div>
            </article>
        </Link>
    )
}

export default SearchResultCard
