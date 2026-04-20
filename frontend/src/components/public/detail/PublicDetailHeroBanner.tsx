import type { Genre } from "../../../api/productions"
import { localize } from "../../../utils/localize"

type ArchiveDetailHeroProps = {
    imageUrl: string
    title?: string | null
    superTitle?: string | null
    artist?: string | null
    genres?: Genre[]
    tags?: Genre[]
    locale: string
}

function ArchiveDetailHero({ imageUrl, title, superTitle, artist, genres, tags, locale }: ArchiveDetailHeroProps) {
    return (
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
            <img
                src={imageUrl}
                alt={title || 'Production image'}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
                {((genres && genres.length > 0) || (tags && tags.length > 0)) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {genres?.map((genre) => {
                            const name = localize(genre.name, locale)
                            if (!name) return null
                            return (
                                <span
                                    key={genre.id}
                                    className="px-2 py-1 text-xs font-medium bg-accent text-white rounded-full"
                                >
                                    {name}
                                </span>
                            )
                        })}
                        {tags?.map((tag) => {
                            const name = localize(tag.name, locale)
                            if (!name) return null
                            return (
                                <span
                                    key={tag.id}
                                    className="px-2 py-1 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm"
                                >
                                    {name}
                                </span>
                            )
                        })}
                    </div>
                )}
                {superTitle && (
                    <p className="text-1xl text-white">{superTitle}</p>
                )}
                {title && (
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
                )}
                {artist && (
                    <p className="text-2xl text-white mt-1">{artist}</p>
                )}
            </div>
        </div>
    )
}

export default ArchiveDetailHero