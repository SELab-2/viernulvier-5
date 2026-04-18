import { useState } from 'react'

type ArchiveDetailGalleryProps = {
    images: (string | null)[]
}

function ArchiveDetailGallery({ images }: ArchiveDetailGalleryProps) {
    const [current, setCurrent] = useState(0)

    const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
    const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))

    return (
        <div className="relative w-full">
            <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden">
                <img
                    src={images[current] || ''}
                    alt={`Gallery image ${current + 1}`}
                    className="w-full h-full object-cover"
                />
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full hover:bg-black/60"
                    >
                        ‹
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2 rounded-full hover:bg-black/60"
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