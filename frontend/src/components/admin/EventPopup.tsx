import type { EventForm } from "../../types/event"
import TagInput from "./TagInput"

type EventPopupProps = {
    fields: EventForm
    isEdit?: boolean
    locations: string[]
    eventTag: string,
    onClose: () => void
    onSave: () => void
    onChange: (field: keyof EventForm, value: string) => void
    onAddTag: () => void
    onChangeTag: (tag: string) => void
    onRemoveTag: (tag: string) => void

    saveButtonLabel: string
    editLabel: string
    addLabel: string
    timeLabel: string
    locationLabel: string
    tagsLabel: string
}

const x = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
const clock =  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-clock-icon lucide-clock"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const building = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-building-icon lucide-building"><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M12 6h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/><path d="M8 6h.01"/><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><rect x="4" y="2" width="16" height="20" rx="2"/></svg>
const hashtag = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-hash-icon lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>

function EventPopup({
    fields,
    isEdit,
    locations,
    eventTag,
    onClose,
    onSave,
    onChange,
    onAddTag,
    onChangeTag,
    onRemoveTag,

    saveButtonLabel,
    editLabel,
    addLabel,
    timeLabel,
    locationLabel,
    tagsLabel,
}: EventPopupProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-2xl bg-background border border-border shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-5">
                    <h2 className="text-xl font-semibold tracking-wide">
                        {isEdit ? editLabel : addLabel}
                    </h2>
                    <button onClick={onClose} className="opacity-70 hover:opacity-100">
                        {x}
                    </button>
                </div>

                {/* BODY */}
                <div className="px-6 py-6 space-y-6">

                    {/* TIME */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            {clock}
                            {timeLabel}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="datetime-local"
                                value={fields.startDateTime}
                                onChange={e => onChange('startDateTime', e.target.value)}
                                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground"
                            />
                            <input
                                type="datetime-local"
                                value={fields.endDateTime}
                                onChange={e => onChange('endDateTime', e.target.value)}
                                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground"
                            />
                        </div>
                    </div>

                    {/* LOCATION + TAGS */}
                    <div className="grid grid-cols-2 gap-6">

                        {/* LOCATION */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                {building}
                                {locationLabel}
                            </div>

                            <select
                                value={fields.location}
                                onChange={e => onChange('location', e.target.value)}
                                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-foreground"
                            >
                                {locations.map((loc, i) => (
                                    <option key={i}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        {/* TAGS */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                {hashtag}
                                {tagsLabel}
                            </div>

                            <TagInput
                                tag={eventTag}
                                tags={fields.tags}
                                addTag={onAddTag}
                                onChange={onChangeTag}
                                onRemove={onRemoveTag}
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end items-center px-6 py-4">
                    <button
                        onClick={onSave}
                        className="mx-4 mb-4 bg-accent text-white px-5 py-2 rounded-full text-sm font-medium hover:opacity-90"
                    >
                        {saveButtonLabel}
                    </button>

                    <button
                        onClick={onClose}
                        className="mx-4 mb-4 text-sm text-muted hover:text-foreground"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )


    return (
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            onClick={onClose}
        >
            {/* overlay */}
            <div className="w-full max-w-2xl rounded-2xl bg-background border border-border"
                onClick={e => e.stopPropagation()}
            >
                {/* header */}
                <div className="flex items-center m-8"> 
                    <p className="text-3xl w-full font-bold tracking-wide">
                        {isEdit ? editLabel : addLabel}
                    </p>
                    <button
                        onClick={onClose}
                    >
                        {x}
                    </button>
                </div>
                
                {/* content */}
                <div className="m-8 flex-row gap-2">
                    <div className="flex gap-2">
                        {clock}
                        <p className="mb-4 text-sm font-bold tracking-wide">
                            {timeLabel}
                        </p>
                    </div>

                    {/* start and end times */}
                    <div className="flex gap-2">
                        <div className="mb-8 gap-2 w-full border border-border rounded-xl">
                            <div className="flex h-12 items-center rounded-md bg-background px-4 text-muted rounded-xl">
                                <input
                                    type="datetime-local"
                                    value={fields.startDateTime}
                                    onChange={e => onChange('startDateTime' ,e.target.value)}
                                    className="w-full text-foreground"
                                >
                                </input>
                            </div>
                        </div>
                        <div className="mb-8 gap-2 w-full border border-border rounded-xl">
                            <div className="flex h-12 items-center rounded-md bg-background px-4 text-muted rounded-xl">
                                <input
                                    type="datetime-local"
                                    value={fields.endDateTime}
                                    onChange={e => onChange('endDateTime', e.target.value)}
                                    className="w-full text-foreground"
                                >
                                </input>
                            </div>
                        </div>

                    </div>

                    {/* location and tags */}
                    <div className="flex gap-2">
                        <div className="w-full">
                            <div className="flex gap-2">
                                {building}
                                <p className="mb-4 text-sm font-bold tracking-wide">
                                    {locationLabel}
                                </p>
                            </div>
                            <div className="mb-8 gap-2 border border-border rounded-xl">
                                <div className="flex h-12 items-center bg-background px-4 text-muted rounded-xl">
                                    <select
                                        value={fields.location}
                                        onChange={e => onChange('location', e.target.value)}
                                        // placeholder={}
                                        className="w-full text-foreground"
                                    >
                                        {locations && locations.map(e => (
                                            <option>{e}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                        </div>

                        <div className="w-full">
                            <div className="flex gap-2">
                                {hashtag}
                                <p className="mb-4 text-sm font-bold tracking-wide">
                                    {tagsLabel}
                                </p>
                            </div>

                            <TagInput
                                tag={eventTag}
                                tags={fields.tags}
                                addTag={onAddTag}
                                onChange={onChangeTag}
                                onRemove={onRemoveTag}
                            />
                                {/* <div className="flex h-12 items-center bg-background px-4 text-muted rounded-xl">
                                    <input
                                        type="text"
                                        value={fields.tags}
                                        onChange={e => onChange('tags', e.target.value)}
                                        // placeholder={}
                                        className="w-full outline-none"
                                    />
                                </div> */}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onSave}
                    className="mx-8 mb-8 text-sm text-white font-regular tracking-wide bg-accent py-2 px-4 rounded-full"
                >
                    {saveButtonLabel}
                </button>
            </div>
        </div>
    )
}

export default EventPopup