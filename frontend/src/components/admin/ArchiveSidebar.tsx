import type { ProductionSettingsFields, LocalizedText } from "../../types/production"
import FuzzyTagInput from "./FuzzyTagInput"

type ArchiveSidebarProps = {
    fields: ProductionSettingsFields
    tag: string
    genre: string
    onAddTag: (tag: LocalizedText) => void
    onChangeTag: (tag: string) => void
    onRemoveTag: (tag: LocalizedText) => void
    onAddGenre: (genre: LocalizedText) => void
    onChangeGenre: (tag: string) => void
    onRemoveGenre: (tag: LocalizedText) => void
    onChange: (field: keyof ProductionSettingsFields, value: string) => void
    productionSettingsLabel: string,
    statusLabel: string,
    genreLabel: string,
    tagLabel: string
    bannerLabel: string,
    extraPicturesLabel: string,
    artistLabel: string
}

// const info = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
const hashtag = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-hash-icon lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
const image = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-image-icon lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
const images = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-images-icon lucide-images"><path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/></svg>
const person = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>

function ArchiveSidebar({
    fields,
    tag,
    genre,
    onChangeTag,
    onRemoveTag,
    onAddTag,
    onChangeGenre,
    onRemoveGenre,
    onAddGenre,
    onChange,
    productionSettingsLabel,
    // statusLabel,
    genreLabel,
    tagLabel,
    bannerLabel,
    extraPicturesLabel,
    artistLabel
}: ArchiveSidebarProps){
    return (
        <div className="bg-surface">
            <div 
                // onSubmit={}
                className="m-4"
            >   
                <p className="text-m text-accent mb-8 font-bold tracking-wide">
                    {productionSettingsLabel}
                </p>
                {/* Extra feature draft, might add this back later*/}
                {/* <div className="flex gap-2">
                    {info}
                    <p className="mb-4 text-sm font-bold tracking-wide">
                        {statusLabel}
                    </p>
                </div>
                <div className="mb-8 gap-2 w-9/10">
                    <div className="flex h-12 items-center rounded-md bg-background px-4 text-muted">
                        <select
                            // value={fields.title}
                            // onChange={e => onChange(e.target.title, 'abc')}
                            // placeholder={}
                            className="w-full text-foreground"
                        >
                            <option>Option A</option>
                            <option>Option B</option>
                            <option>Option C</option>
                        </select>
                    </div>
                </div> */}
                <div className="flex gap-2">
                    {hashtag}
                    <p className="mb-4 text-sm font-bold tracking-wide">
                        {genreLabel}
                    </p>
                </div>
                <FuzzyTagInput
                    tag={genre}
                    tags={fields.genres}
                    endpoint="/archive/genres"
                    addTag={onAddGenre}
                    onChange={onChangeGenre}
                    onRemove={onRemoveGenre}
                    placeholder="Add genre..."
                />
                <div className="flex gap-2">
                    {hashtag}
                    <p className="mb-4 text-sm font-bold tracking-wide">
                        {tagLabel}
                    </p>
                </div>
                <FuzzyTagInput
                    tag={tag}
                    tags={fields.tags}
                    endpoint="/archive/tags"
                    addTag={onAddTag}
                    onChange={onChangeTag}
                    onRemove={onRemoveTag}
                    placeholder="Add tag..."
                />
                {/* <div className="mb-8 gap-2 w-9/10">
                    <div className="flex h-12 items-center rounded-md bg-background px-4 text-muted">
                        <input
                            type="text"
                            // value={fields.title}
                            // onChange={e => onChange(e.target.title, 'abc')}
                            // placeholder={}
                            className="outline-none"
                        />
                    </div>
                </div> */}
                <div className="flex gap-2">
                    {image}
                    <p className="mb-4 text-sm font-bold tracking-wide">
                    {bannerLabel}
                    </p>
                </div>
                <div className="mb-8 gap-2 w-9/10">
                    <div className="flex h-12 items-center rounded-md bg-background px-4 text-muted">
                        <input
                            type="file"
                            accept="image/*"
                            // onChange={e => onChange(e.target.title, 'abc')}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    {images}
                    <p className="mb-4 text-sm font-bold tracking-wide">
                    {extraPicturesLabel}
                    </p>
                </div>
                <div className="mb-8 gap-2 w-9/10">
                    <div className="flex h-12 items-center rounded-md bg-background px-4">
                        <input
                            type="file"
                            accept="image/*"
                            // onChange={e => onChange(e.target.title, 'abc')}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    {person}
                    <p className="mb-4 text-sm font-bold tracking-wide">
                    {artistLabel}
                    </p>
                </div>
                <div className="mb-8 gap-2 w-9/10">
                    <div className="flex h-12 items-center rounded-md bg-background px-4">
                        <input
                            type="text"
                            value={fields.artist}
                            onChange={e => onChange('artist', e.target.value)}
                            placeholder="Artist..."
                            className="outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
export default ArchiveSidebar