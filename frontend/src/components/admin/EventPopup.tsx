import type { EventLinks, Event } from "../../types/event"

type EventPopupProps = {
    fields: Event
    isEdit?: boolean
    locations: string[]
    onClose: () => void
    onSave: () => void
    onChange: (field: keyof Event | keyof EventLinks, value: string) => void

    saveButtonLabel: string
    editLabel: string
    addLabel: string
    timeLabel: string
    locationLabel: string
    commentLabel: string
}

const x = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
const clock =  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-clock-icon lucide-clock"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
const building = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-building-icon lucide-building"><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M12 6h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/><path d="M8 6h.01"/><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><rect x="4" y="2" width="16" height="20" rx="2"/></svg>
const hashtag = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent lucide lucide-hash-icon lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>

function EventPopup({
    fields,
    isEdit,
    locations,
    onClose,
    onSave,
    onChange,

    saveButtonLabel,
    editLabel,
    addLabel,
    timeLabel,
    locationLabel,
    commentLabel,
}: EventPopupProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="admin-shell w-full max-w-2xl rounded-2xl bg-background border border-border shadow-xl"
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
                                value={fields.starts_at ?? ''}
                                onChange={e => onChange('starts_at', e.target.value)}
                                className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-foreground"
                            />
                            <input
                                type="datetime-local"
                                value={fields.ends_at}
                                onChange={e => onChange('ends_at', e.target.value)}
                                className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-foreground"
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
                                value={fields.links?.hall}
                                onChange={e => onChange('hall', e.target.value)}
                                className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-foreground"
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
                                {commentLabel}
                            </div>
                                <input
                                    type="text"
                                    value={fields.info}
                                    onChange={e => onChange('info', e.target.value)}
                                    placeholder="type here ..."
                                    className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-foreground outline-none"
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
}

export default EventPopup
