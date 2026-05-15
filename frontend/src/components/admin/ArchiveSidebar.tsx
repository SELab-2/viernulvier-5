import FuzzyTagInput from "./FuzzyTagInput"
import { useState } from "react"
import type { useTagInput } from "./hooks/useTagInput"

type ArchiveSidebarProps = {
    genre:  ReturnType<typeof useTagInput>
    tag: ReturnType<typeof useTagInput>
    productionSettingsLabel: string,
    genreLabel: string,
    tagLabel: string,
    bannerLabel: string,
    extraPicturesLabel: string,
    addGenrePlaceholder: string,
    addTagPlaceholder: string,
    chooseFilePlaceholder: string,
}

const hashtag = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-hash-icon lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
const image = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-image-icon lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
const images = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-images-icon lucide-images"><path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/></svg>

function ArchiveSidebar({
    genre,
    tag,
    productionSettingsLabel,
    genreLabel,
    tagLabel,
    bannerLabel,
    extraPicturesLabel,
    addGenrePlaceholder,
    addTagPlaceholder,
    chooseFilePlaceholder,
}: ArchiveSidebarProps){
    const [bannerFileName, setBannerFileName] = useState<string | undefined>(undefined)
    const [extraFiles, setExtraFiles] = useState<string | undefined>(undefined)

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
                        <p className="text-sm font-bold tracking-wide">
                            {genreLabel}
                        </p>
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
                        <p className="text-sm font-bold tracking-wide">
                            {tagLabel}
                        </p>
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
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex gap-2 items-center">
                        {image}
                        <p className="text-sm font-bold tracking-wide">
                            {bannerLabel}
                        </p>
                    </div>
                    <label className="flex h-12 items-center rounded-md bg-surface px-4 text-muted border border-border cursor-pointer relative overflow-hidden">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                setBannerFileName(file ? file.name : undefined);
                            }}
                        />
                        <span className="flex-1 truncate text-foreground">
                            {bannerFileName ? bannerFileName : chooseFilePlaceholder}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-2 text-accent"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                    </label>
                </div>

                {/* Extra foto's upload */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                        {images}
                        <p className="text-sm font-bold tracking-wide">
                            {extraPicturesLabel}
                        </p>
                    </div>
                    <label className="flex h-12 items-center rounded-md bg-surface px-4 text-muted border border-border cursor-pointer relative overflow-hidden">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={e => {
                                const files = e.target.files;
                                setExtraFiles(files ? Array.from(files).map(f => f.name).join(', ') : undefined);
                            }}
                        />
                        <span className="flex-1 truncate text-foreground">
                            {extraFiles ? extraFiles : chooseFilePlaceholder}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-2 text-accent"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                    </label>
                </div>
            </div>
        </div>
    )
}
export default ArchiveSidebar
