import { useRef, useState } from 'react'

type BlogBannerUploadSectionProps = {
    images: string[]
    thumbnailIndex: number | null
    onThumbnailIndexChange: (index: number | null) => void
    onPendingFilesChange: (files: File[]) => void
    isUploading?: boolean
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function BlogBannerUploadSection({
    images,
    thumbnailIndex,
    onThumbnailIndexChange,
    onPendingFilesChange,
    isUploading = false,
}: BlogBannerUploadSectionProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = Array.from(event.target.files ?? [])
        const acceptedFiles = nextFiles.filter((file) => ALLOWED_IMAGE_TYPES.has(file.type))
        const rejectedFiles = nextFiles.filter((file) => !ALLOWED_IMAGE_TYPES.has(file.type))

        if (rejectedFiles.length > 0) {
            const rejectedNames = rejectedFiles.map((file) => file.name).join(', ')
            setError(`Invalid file types: ${rejectedNames}`)
        } else {
            setError(null)
        }

        // Create preview URLs
        const previews = await Promise.all(
            acceptedFiles.map((file) => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(String(reader.result ?? ''))
                    reader.readAsDataURL(file)
                })
            })
        )

        const newFiles = [...selectedFiles, ...acceptedFiles]
        setSelectedFiles(newFiles)
        setPreviewUrls((current) => [...current, ...previews])
        onPendingFilesChange(newFiles)

        // Reset input
        event.target.value = ''
    }

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index)
        setSelectedFiles(newFiles)
        setPreviewUrls((current) => current.filter((_, i) => i !== index))
        onPendingFilesChange(newFiles)
    }

    const selectThumbnail = (index: number) => {
        onThumbnailIndexChange(index)
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">Blog banners / images</label>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => {
                        void handleFileSelect(event)
                    }}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => {
                        fileInputRef.current?.click()
                    }}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>+</span>
                    <span>Add images</span>
                </button>

                <p className="text-xs text-muted mt-2">
                    Allowed formats: JPG, PNG, WEBP, GIF. 
                    {images.length > 0 && ` ${images.length} image${images.length !== 1 ? 's' : ''} already uploaded.`}
                </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Display uploaded images */}
            {images.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-foreground mb-2">Uploaded images</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {images.map((imagePath, index) => (
                            <div key={imagePath} className="relative group">
                                <div
                                    className={`aspect-square overflow-hidden rounded-lg border-2 transition ${
                                        thumbnailIndex === index
                                            ? 'border-amber-400 ring-2 ring-amber-400/50'
                                            : 'border-border hover:border-accent/50'
                                    }`}
                                >
                                    <img
                                        src={imagePath}
                                        alt={`Blog image ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                {thumbnailIndex === index && (
                                    <div className="absolute top-1 right-1 text-xl">⭐</div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition rounded-lg flex items-center justify-center gap-1">
                                    {thumbnailIndex !== index && (
                                        <button
                                            type="button"
                                            onClick={() => selectThumbnail(index)}
                                            className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 transition opacity-0 group-hover:opacity-100"
                                        >
                                            Set
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Display pending files */}
            {selectedFiles.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                        Pending upload ({selectedFiles.length})
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {selectedFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-lg border border-dashed border-accent/50 bg-accent/5">
                                    <img
                                        src={previewUrls[index]}
                                        alt={`Preview ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black/60 transition rounded-lg flex flex-col items-center justify-center gap-1">
                                    <p className="text-xs text-white font-medium text-center px-1 line-clamp-2">
                                        {file.name}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        disabled={isUploading}
                                        className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
