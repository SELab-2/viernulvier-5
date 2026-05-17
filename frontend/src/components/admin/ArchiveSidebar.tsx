import FuzzyTagInput from "./FuzzyTagInput"
import { useState, useEffect } from "react"
import type { useTagInput } from "./hooks/useTagInput"

type ArchiveSidebarProps = {
    genre: ReturnType<typeof useTagInput>
    tag: ReturnType<typeof useTagInput>
    bannerFile: File | null
    extraFiles: File[]
    onBannerChange: (file: File | null) => void
    onExtraFilesChange: (files: File[]) => void
    productionSettingsLabel: string
    genreLabel: string
    tagLabel: string
    bannerLabel: string
    extraPicturesLabel: string
    addGenrePlaceholder: string
    addTagPlaceholder: string
    chooseFilePlaceholder: string
}

const hashtag = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
const image = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
const images = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-images"><path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/></svg>
const xIcon = <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const fileIcon = <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>

function FileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!isImage) return
        const url = URL.createObjectURL(file)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [file, isImage])

    const shortName = file.name.length > 22 ? file.name.slice(0, 19) + '…' : file.name

    return (
        <div className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-md px-2 py-1 text-xs max-w-[200px]">
            {previewUrl
                ? <img src={previewUrl} className="w-[18px] h-[18px] rounded-sm object-cover shrink-0" alt="" />
                : <span className="text-muted shrink-0">{fileIcon}</span>
            }
            <span className="truncate flex-1 text-primary">{shortName}</span>
            <button
                type="button"
                onClick={onRemove}
                className="text-muted hover:text-red-500 transition-colors shrink-0"
                aria-label={`Remove ${file.name}`}
            >
                {xIcon}
            </button>
        </div>
    )
}

function ArchiveSidebar({
    genre,
    tag,
    bannerFile,
    extraFiles,
    onBannerChange,
    onExtraFilesChange,

    productionSettingsLabel,
    genreLabel,
    tagLabel,
    bannerLabel,
    extraPicturesLabel,
    addGenrePlaceholder,
    addTagPlaceholder,
    chooseFilePlaceholder,
}: ArchiveSidebarProps) {
    return (
        <div className="bg-surface w-1/4">
            <div className="m-4 flex flex-col gap-6">
                <p className="text-xl text-accent font-semibold tracking-wide">
                    {productionSettingsLabel}
                </p>

                {/* Genre */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        {hashtag}
                        <p className="text-sm font-bold tracking-wide">{genreLabel}</p>
                    </div>
                    <FuzzyTagInput
                        tag={genre.input}
                        tags={genre.items}
                        endpoint="/archive/genres"
                        addTag={genre.add}
                        onChange={genre.setInput}
                        onRemove={genre.remove}
                        placeholder={addGenrePlaceholder}
                    />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        {hashtag}
                        <p className="text-sm font-bold tracking-wide">{tagLabel}</p>
                    </div>
                    <FuzzyTagInput
                        tag={tag.input}
                        tags={tag.items}
                        endpoint="/archive/tags"
                        addTag={tag.add}
                        onChange={tag.setInput}
                        onRemove={tag.remove}
                        placeholder={addTagPlaceholder}
                    />
                </div>

                {/* Banner upload */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        {image}
                        <p className="text-sm font-bold tracking-wide">{bannerLabel}</p>
                    </div>
                    <label className="flex h-12 items-center rounded-md bg-surface px-4 text-muted border border-border cursor-pointer relative overflow-hidden">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) onBannerChange(file)
                                e.target.value = ''
                            }}
                        />
                        <span className="flex-1 truncate text-muted">{chooseFilePlaceholder}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-2 text-accent shrink-0"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                    </label>
                    {bannerFile && (
                        <div className="flex flex-wrap gap-1.5">
                            <FileChip file={bannerFile} onRemove={() => onBannerChange(null)} />
                        </div>
                    )}
                </div>

                {/* Extra foto's upload */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        {images}
                        <p className="text-sm font-bold tracking-wide">{extraPicturesLabel}</p>
                    </div>
                    <label className="flex h-12 items-center rounded-md bg-surface px-4 text-muted border border-border cursor-pointer relative overflow-hidden">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={e => {
                                const files = Array.from(e.target.files ?? [])
                                if (files.length) onExtraFilesChange([...extraFiles, ...files])
                                e.target.value = ''
                            }}
                        />
                        <span className="flex-1 truncate text-muted">{chooseFilePlaceholder}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-2 text-accent shrink-0"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                    </label>
                    {extraFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {extraFiles.map((file, i) => (
                                <FileChip
                                    key={`${file.name}-${i}`}
                                    file={file}
                                    onRemove={() => onExtraFilesChange(extraFiles.filter((_, j) => j !== i))}
                                />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default ArchiveSidebar
