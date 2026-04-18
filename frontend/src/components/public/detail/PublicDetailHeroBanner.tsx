type ArchiveDetailHeroProps = {
    imageUrl: string
    title?: string | null
    superTitle?: string | null
    artist?: string | null
}

function ArchiveDetailHero({ imageUrl, title, superTitle, artist }: ArchiveDetailHeroProps) {
    return (
        <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
            <img
                src={imageUrl}
                alt={title || 'Production image'}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
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