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

            {images.length > 1 && (
                <div className="flex items-center justify-end gap-4 text-2xl text-foreground mb-2">
                    <button
                        onClick={prev}
                        className="h-10 w-10 rounded-full border border-border transition-colors hover:bg-surface"
                        aria-label={messages.detail.previousImage}
                    >
                        ‹
                    </button>
                    <span className="text-sm text-muted">{current + 1} / {images.length}</span>
                    <button
                        onClick={next}
                        className="h-10 w-10 rounded-full border border-border transition-colors hover:bg-surface"
                        aria-label={messages.detail.nextImage}
                    >
                        ›
                    </button>
                </div>
            )}

            <div className="w-full rounded-xl overflow-hidden">
                {images[current] && (
                    <img
                        src={images[current]!}
                        alt={`Gallery image ${current + 1}`}
                        className="w-full h-auto"
                    />
                )}
            </div>
        </div>
    )
}

export default ArchiveDetailGallery