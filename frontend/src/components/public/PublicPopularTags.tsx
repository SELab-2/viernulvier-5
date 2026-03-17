type PublicPopularTagsProps = {
    label: string
    tags: string[]
    moreLabel: string
    onTagClick: (tag: string) => void
}

function PublicPopularTags({ label, tags, moreLabel, onTagClick }: PublicPopularTagsProps) {
    return (
        <section className="mt-14 bg-[var(--color-accent)] py-8">
            <div className="site-container flex flex-wrap items-center gap-4">
                <p className="text-xl text-white">{label}</p>
                <div className="flex flex-wrap items-center gap-3">
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => onTagClick(tag)}
                            className="rounded-full bg-white px-5 py-2 text-base text-black transition hover:bg-zinc-100"
                        >
                            {tag}
                        </button>
                    ))}
                    <button
                        type="button"
                        className="rounded-full border border-dashed border-white px-6 py-2 text-base text-white transition hover:bg-white/10"
                    >
                        {moreLabel}
                    </button>
                </div>
            </div>
        </section>
    )
}

export default PublicPopularTags
