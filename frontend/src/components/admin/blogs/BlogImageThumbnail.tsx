type BlogImageThumbnailProps = {
    imagePath: string
    index: number
    isSelected: boolean
    onSelect: (index: number) => void
    onDelete: (index: number) => void
    isUploading?: boolean
    isPending?: boolean
}

export function BlogImageThumbnail({
    imagePath,
    index,
    isSelected,
    onSelect,
    onDelete,
    isUploading = false,
    isPending = false
}: BlogImageThumbnailProps) {
    return (
        <div className={`relative group ${isPending ? 'opacity-75' : ''}`}>
            {/* Image container - clickable to select as thumbnail */}
            <div 
                onClick={() => !isPending && onSelect(index)}
                className={`aspect-square overflow-hidden rounded-lg transition cursor-pointer ${
                    isSelected
                        ? 'border-4 border-blue-500'
                        : 'border-2 border-gray-300 hover:border-gray-400'
                }`}
            >
                <img
                    src={imagePath}
                    alt={`Blog image ${index + 1}`}
                    className="h-full w-full object-cover"
                />
            </div>

            {/* Delete button (top-left) */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(index)
                }}
                disabled={isUploading}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete image"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 1V2h11V1h-11z" />
                </svg>
            </button>
        </div>
    )
}
