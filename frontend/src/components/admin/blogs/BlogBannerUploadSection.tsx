import { useRef, useState } from 'react'
import type { Messages } from '../../../i18n/types'
import { BlogImageThumbnail } from './BlogImageThumbnail'
import { resolveBlogImageUrl } from './blogImageUrl'

type BlogBannerUploadSectionProps = {
    images: string[]
    thumbnailIndex: number | null
    onThumbnailIndexChange: (index: number | null) => void
    onPendingFilesChange: (files: File[]) => void
    onDeleteImage?: (index: number) => void
    isUploading?: boolean
    messages: Messages
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function BlogBannerUploadSection({
    images,
    thumbnailIndex,
    onThumbnailIndexChange,
    onPendingFilesChange,
    onDeleteImage,
    isUploading = false,
    messages,
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

    const deleteUploadedImage = (index: number) => {
        if (thumbnailIndex === index) {
            onThumbnailIndexChange(null)
        }
        onDeleteImage?.(index)
    }

    const selectThumbnail = (index: number) => {
        onThumbnailIndexChange(index)
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">{messages.blogs.bannerUpload.label}</label>
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
                    <span>{messages.blogs.bannerUpload.addButton}</span>
                </button>

                <p className="text-xs text-muted mt-2">
                    {messages.blogs.bannerUpload.allowedFormats}
                    {images.length > 0 && messages.blogs.bannerUpload.alreadyUploaded(images.length)}
                </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Display all images (uploaded + pending) */}
            {(images.length > 0 || selectedFiles.length > 0) && (
                <div>
                    <p className="text-sm font-medium text-foreground mb-2">{messages.blogs.bannerUpload.uploadedImagesLabel}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {/* Display uploaded images */}
                        {images.map((imagePath, index) => (
                            <BlogImageThumbnail
                                key={`uploaded-${imagePath}`}
                                imagePath={resolveBlogImageUrl(imagePath)}
                                index={index}
                                isSelected={thumbnailIndex === index}
                                onSelect={selectThumbnail}
                                onDelete={deleteUploadedImage}
                                isUploading={isUploading}
                                isPending={false}
                                messages={messages}
                            />
                        ))}

                        {/* Display pending files */}
                        {selectedFiles.map((file, index) => (
                            <BlogImageThumbnail
                                key={`pending-${file.name}-${index}`}
                                imagePath={previewUrls[index] || ''}
                                index={images.length + index}
                                isSelected={thumbnailIndex === images.length + index}
                                onSelect={selectThumbnail}
                                onDelete={() => removeFile(index)}
                                isUploading={isUploading}
                                isPending={true}
                                messages={messages}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
