export type SearchResultItem = {
    id: string
    tag: string
    date: string
    title: string
    excerpt: string
    venue: string
}

type SearchResultCardProps = {
    item: SearchResultItem
}

function SearchResultCard({ item }: SearchResultCardProps) {
    return (
        <article className="border-b border-border pb-5">
            <div className="relative h-32 overflow-hidden rounded-md sm:h-36 bg-gradient-to-br from-accent to-accent/50">
                <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-xs font-semibold lowercase text-white backdrop-blur-sm">
                    {item.tag}
                </span>
            </div>
            <p className="mt-3 text-xs text-text-accent">{item.date}</p>
            <h3 className="mt-1 text-2xl leading-none text-foreground">{item.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-accent">{item.excerpt}</p>
            <p className="mt-4 text-xs font-semibold lowercase tracking-wide text-text-accent">{item.venue}</p>
        </article>
    )
}

export default SearchResultCard
