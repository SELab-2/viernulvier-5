import FuzzyTagInput from "./FuzzyTagInput"
import { useState, useEffect } from "react"
import type { useTagInput } from "./hooks/useTagInput"
import { type ImageSlot } from "../../api/media"

// ─── Types ────────────────────────────────────────────────────────────────────

type ArchiveSidebarProps = {
    genre: ReturnType<typeof useTagInput>
    tag:   ReturnType<typeof useTagInput>

    bannerSlot:   ImageSlot | null
    extraSlots:   ImageSlot[]
    onBannerChange:     (slot: ImageSlot | null) => void
    onExtraSlotsChange: (slots: ImageSlot[]) => void

    productionSettingsLabel: string
    genreLabel:              string
    tagLabel:                string
    bannerLabel:             string
    extraPicturesLabel:      string
    addGenrePlaceholder:     string
    addTagPlaceholder:       string
    chooseFilePlaceholder:   string
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

const hashtag = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
const imageIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
const imagesIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-images"><path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/></svg>
const xIcon = <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const uploadIcon = <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
const cloudIcon = <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>

// ─── ImageSlotChip ────────────────────────────────────────────────────────────
//
// Renders a small chip for either an existing (URL) or pending (File) slot.
// Existing slots show the crop URL directly – no re-download of originals.
// Pending slots create a temporary object URL for the preview.

function ImageSlotChip({ slot, onRemove }: { slot: ImageSlot; onRemove: () => void }) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const label = slot.kind === 'existing'
        ?  'saved image'
        : slot.file.name

    useEffect(() => {
        let cancelled = false
        let pendingUrl: string | null = null

        const safeSet = (src: string | null) => {
            if (!cancelled) setPreviewUrl(src)
        }

        if (slot.kind === 'existing') {
            // Use stable image endpoint so previews work across admin/public hosts.
            safeSet(`/api/v1/images/${slot.crop_id}`)
        } else {
            // Pending: create a temporary object URL and set state asynchronously
            const url = URL.createObjectURL(slot.file)
            pendingUrl = url
            // schedule update to avoid synchronous setState inside the effect
            const t = window.setTimeout(() => safeSet(url), 0)
            // ensure we clear the timeout if effect cleans up early
            return () => {
                cancelled = true
                clearTimeout(t)
                if (pendingUrl) URL.revokeObjectURL(pendingUrl)
            }
        }

        return () => {
            cancelled = true
            if (pendingUrl) URL.revokeObjectURL(pendingUrl)
        }
    }, [slot])

    const shortName = label.length > 22 ? label.slice(0, 19) + '…' : label

    return (
        <div className="inline-flex items-center gap-1.5 bg-surface border border-border rounded-md px-2 py-1 text-xs max-w-[200px]">
            {/* Thumbnail */}
            {previewUrl
                ? <img src={previewUrl} className="w-[18px] h-[18px] rounded-sm object-cover shrink-0" alt="" />
                : <span className="text-muted shrink-0 w-[18px] h-[18px]" />
            }

            <span className="truncate flex-1 text-primary">{shortName}</span>

            {/* Badge: cloud = already saved, nothing = pending upload */}
            {slot.kind === 'existing' && (
                <span className="text-muted shrink-0" title="Already saved on server">
                    {cloudIcon}
                </span>
            )}

            <button
                type="button"
                onClick={onRemove}
                className="text-muted hover:text-red-500 transition-colors shrink-0"
                aria-label={`Remove ${label}`}
            >
                {xIcon}
            </button>
        </div>
    )
}

// ─── FileUploadRow ────────────────────────────────────────────────────────────

function FileUploadRow({
    multiple,
    placeholder,
    onChange,
}: {
    multiple?: boolean
    placeholder: string
    onChange: (files: File[]) => void
}) {
    return (
        <label className="text-sm flex h-12 items-center rounded-md bg-surface px-4 text-muted border border-border cursor-pointer relative overflow-hidden">
            <input
                type="file"
                accept="image/*"
                multiple={multiple}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={e => {
                    const files = Array.from(e.target.files ?? [])
                    if (files.length) onChange(files)
                    e.target.value = ''
                }}
            />
            <span className="flex-1 truncate text-muted">{placeholder}</span>
            <span className="ml-2 text-accent shrink-0">{uploadIcon}</span>
        </label>
    )
}

// ─── ArchiveSidebar ───────────────────────────────────────────────────────────

function ArchiveSidebar({
    genre,
    tag,
    bannerSlot,
    extraSlots,
    onBannerChange,
    onExtraSlotsChange,

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

                {/* Banner */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        {imageIcon}
                        <p className="text-sm font-bold tracking-wide">{bannerLabel}</p>
                    </div>

                    {/* Only show the file picker when there is no banner yet */}
                    {!bannerSlot && (
                        <FileUploadRow
                            placeholder={chooseFilePlaceholder}
                            onChange={([file]) => onBannerChange({ kind: 'pending', file })}
                        />
                    )}

                    {bannerSlot && (
                        <div className="flex flex-wrap gap-1.5">
                            <ImageSlotChip
                                slot={bannerSlot}
                                onRemove={() => onBannerChange(null)}
                            />
                        </div>
                    )}
                </div>

                {/* Extra pictures */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        {imagesIcon}
                        <p className="text-sm font-bold tracking-wide">{extraPicturesLabel}</p>
                    </div>

                    <FileUploadRow
                        multiple
                        placeholder={chooseFilePlaceholder}
                        onChange={files =>
                            onExtraSlotsChange([
                                ...extraSlots,
                                ...files.map(file => ({ kind: 'pending' as const, file })),
                            ])
                        }
                    />

                    {extraSlots.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {extraSlots.map((slot, i) => (
                                <ImageSlotChip
                                    key={slot.kind === 'existing' ? slot.crop_id : `${(slot as { kind: 'pending'; file: File }).file.name}-${i}`}
                                    slot={slot}
                                    onRemove={() =>
                                        onExtraSlotsChange(extraSlots.filter((_, j) => j !== i))
                                    }
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
