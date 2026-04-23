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
    isProductionReference?: boolean
    detailHref?: string
}

type SearchResultCardProps = {
    item: SearchResultItem
}

function capitalizeFirst(value: string): string {
    if (value.length === 0) return value
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function SearchResultCard({ item }: SearchResultCardProps) {
    const normalizedTitle = capitalizeFirst(item.title.trim())
    const displayTitle = normalizedTitle.length > 110 ? `${normalizedTitle.slice(0, 107)}...` : normalizedTitle
    const showExcerpt = Boolean(item.excerpt) && !item.isProductionReference
    const imageUrl = item.imageUrl ?? FALLBACK_IMAGE

    const card = (
        <article className="flex h-full w-full flex-col border-b border-border pb-5">
            <div className="relative h-32 overflow-hidden rounded-md sm:h-36 bg-gradient-to-br from-accent to-accent/50">
                <img
                    src={imageUrl}
                    alt={item.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20" />
                <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-xs font-semibold lowercase text-white backdrop-blur-sm">
                    {item.tag}
                </span>
            </div>
            <div className="flex flex-1 flex-col">
                <p className="mt-3 text-xs text-text-accent">{item.date}</p>
                <h3 className="mt-1 line-clamp-3 text-2xl leading-none text-foreground [overflow-wrap:anywhere]">{displayTitle}</h3>
                <p className={`mt-2 line-clamp-2 text-sm leading-relaxed ${showExcerpt ? 'text-text-accent' : 'invisible'}`}>
                    {showExcerpt ? item.excerpt : '\u00a0'}
                </p>
                <p className="mt-auto pt-4 text-xs font-semibold lowercase tracking-wide text-text-accent">
                    {item.isProductionReference ? `∋ ${item.venue}` : item.venue}
                </p>
            </div>
        </article>
    )

    if (item.detailHref) {
        return (
            <Link to={item.detailHref} className="block h-full">
                {card}
            </Link>
        )
    }

    return card
}
export default SearchResultCard
