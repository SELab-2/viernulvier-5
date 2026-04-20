type EventPopupProps = {
    isEdit?: boolean
    onClose: () => void

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
    isEdit,
    onClose,

    editLabel,
    addLabel,
    timeLabel,
    locationLabel,
    tagsLabel,
}: EventPopupProps) {
    return (
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            {/* overlay */}
            <div className="relative rounded-2xl bg-background border-border border h-1/3 w-2/3"
                onClick={e => e.stopPropagation()}
            >
                {/* header */}
                <div className="flex items-center m-8"> 
                    <p className="text-3xl w-full font-bold tracking-wide">
                        {isEdit &&
                            editLabel 
                        }
                        {!isEdit &&
                            addLabel
                        }
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
                                    type="date"
                                    // value={fields.title}
                                    // onChange={e => onChange(e.target.title, 'abc')}
                                    className="w-full text-foreground"
                                >
                                </input>
                            </div>
                        </div>
                        <div className="mb-8 gap-2 w-full border border-border rounded-xl">
                            <div className="flex h-12 items-center rounded-md bg-background px-4 text-muted rounded-xl">
                                <input
                                    type="date"
                                    // value={fields.title}
                                    // onChange={e => onChange(e.target.title, 'abc')}
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
                            </div>

                        </div>

                        <div className="w-full">
                            <div className="flex gap-2">
                                {hashtag}
                                <p className="mb-4 text-sm font-bold tracking-wide">
                                    {tagsLabel}
                                </p>
                            </div>
                            <div className="mb-8 gap-2 border border-border rounded-xl">
                                <div className="flex h-12 items-center bg-background px-4 text-muted rounded-xl">
                                    <input
                                        type="text"
                                        // value={fields.title}
                                        // onChange={e => onChange(e.target.title, 'abc')}
                                        // placeholder={}
                                        className="w-full outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EventPopup