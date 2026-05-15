import type { Messages } from '../../../i18n/types'
import { resolveBlogImageUrl } from './blogImageUrl'

type BlogImageThumbnailProps = {
    imagePath: string
    index: number
    isSelected: boolean
    onSelect: (index: number) => void
    onDelete: (index: number) => void
    isUploading?: boolean
    isPending?: boolean
    messages: Messages
}

export function BlogImageThumbnail({
    imagePath,
    index,
    isSelected,
    onSelect,
    onDelete,
    isUploading = false,
    messages,
}: BlogImageThumbnailProps) {
    return (
        <div className={`relative group`}>
            {/* Image container - clickable to select as thumbnail */}
            <div 
                onClick={() => onSelect(index)}
                className={`aspect-square overflow-hidden rounded-lg transition cursor-pointer ${
                    isSelected
                        ? 'border-4 border-blue-500'
                        : 'border-2 border-gray-300 hover:border-gray-400'
                }`}
            >
                <img
                    src={resolveBlogImageUrl(imagePath)}
                    alt={`Blog image ${index + 1}`}
                    className="h-full w-full object-cover"
                />
            </div>

            {/* Cover label badge */}
            {isSelected ? (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
                    {messages.blogs.bannerUpload.coverLabel}
                </div>
            ) : null}

            {/* Delete button (top-right) */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(index)
                }}
                disabled={isUploading}
                aria-label={messages.blogs.bannerUpload.deleteImageAriaLabel}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity rounded-full border border-border bg-background/90 p-2 text-muted hover:border-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-trash2-icon lucide-trash-2"
                >
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
            </button>
        </div>
    )
}
