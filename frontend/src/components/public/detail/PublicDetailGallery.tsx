import { useState } from 'react'
import { usePublicMessages } from '../PublicMessagesContext'

type ArchiveDetailGalleryProps = {
    images: (string | null)[]
}

function ArchiveDetailGallery({ images }: ArchiveDetailGalleryProps) {
    const messages = usePublicMessages()

    const [current, setCurrent] = useState(0)

    const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
    const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))

    return (
        <div className="relative w-full">
            <div className="hidden">
                {images.map((src, i) => src && i !== current && (
                    <img key={i} src={src} alt="" />
                ))}
            </div>
            <div className="w-full rounded-xl overflow-hidden">
                {images[current] && (
                    <img
                        src={images[current]!}
                        alt={`Gallery image ${current + 1}`}
                        className="w-full h-auto"
                    />
                )}
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 
                                    bg-black/70 text-white 
                                    w-10 h-10 flex items-center justify-center 
                                    rounded-full text-xl font-bold 
                                    hover:bg-black transition"
                        aria-label={messages.detail.previousImage}
                    >
                        ‹
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white 
                                    w-10 h-10 flex items-center justify-center 
                                    rounded-full text-xl font-bold 
                                    hover:bg-black transition"
                        aria-label={messages.detail.nextImage}
                    >
                        ›
                    </button>
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                        {current + 1} / {images.length}
                    </div>
                </>
            )}
        </div>
    )
}

export default ArchiveDetailGallery