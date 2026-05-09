import type { Genre } from "../../../api/genres"
import { localize } from "../../../utils/localize"

type ArchiveDetailHeroProps = {
    imageUrl: string
    title?: string | null
    superTitle?: string | null
    artist?: string | null
    genres?: Genre[]
    locale: string
    shareLabel?: string
    onShare?: () => void
}

function ArchiveDetailHero({ imageUrl, title, superTitle, artist, genres, locale, shareLabel, onShare }: ArchiveDetailHeroProps) {
    return (
        <div className="relative h-[360px] w-full overflow-hidden rounded-xl md:h-[430px]">
            <img
                src={imageUrl}
                alt={title || 'Production image'}
                className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/65" />
            {onShare ? (
                <div className="absolute right-5 top-5 z-10 md:right-6 md:top-6">
                    <button
                        type="button"
                        onClick={onShare}
                        className="inline-flex h-9 items-center gap-1 rounded-full border border-white/45 bg-black/35 px-3 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/55"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <path d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49" strokeLinecap="round" />
                        </svg>
                        <span>{shareLabel ?? 'Deel'}</span>
                    </button>
                </div>
            ) : null}
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-7">
                {genres && genres.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {genres.map((genre) => {
                            const name = localize(genre.name, locale)
                            if (!name) return null
                            return (
                                <span
                                    key={genre.id}
                                    className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white"
                                >
                                    {name}
                                </span>
                            )
                        })}
                    </div>
                )}
                {superTitle && (
                    <p className="text-lg text-white/90">{superTitle}</p>
                )}
                {title && (
                    <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">{title}</h1>
                )}
                {artist && (
                    <p className="mt-2 text-2xl text-white/95">{artist}</p>
                )}
            </div>
        </div>
    )
}

export default ArchiveDetailHero