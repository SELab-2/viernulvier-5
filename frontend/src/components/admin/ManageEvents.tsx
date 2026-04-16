import type { Event } from '../../types/event'

type EventsProps = {
    events: Event[],
    makeEvent: () => void,
    editEvent: () => void,
    deleteEvent: () => void
    makeLabel: string
    dateLabel: string,
    timeLabel: string,
    locationLabel: string,
    commentLabel: string,
    actionsLabel: string,
}

const pencil = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
const trash = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>


function EventsEdit({ 
    events, 
    makeEvent, 
    editEvent, 
    deleteEvent, 
    makeLabel, 
    dateLabel, 
    timeLabel, 
    locationLabel, 
    commentLabel, 
    actionsLabel
}: EventsProps ){
    return (
        <div className="flex-col">
            <div className="mb-8 mx-8 overflow-hidden">
                <table className=" w-full border-collapse font-muted">
                    <thead className="border-b border-border">
                        <tr>
                            <th className="px-4 py-4">{dateLabel}</th>
                            <th className="px-4 py-4">{timeLabel}</th>
                            <th className="px-4 py-4">{locationLabel}</th>
                            <th className="px-4 py-4">{commentLabel}</th>
                            <th className="px-4 py-4">{actionsLabel}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event) =>
                            <tr className="h-12 bg-surface" key={event.key}>
                                <td className="px-4 py-4">{event.date}</td>
                                <td className="px-4 py-4">{event.time}</td>
                                <td className="px-4 py-4">{event.location}</td>
                                <td className="px-4 py-4">{event.comment}</td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-12">
                                        <button
                                            onClick={editEvent}
                                            className=""
                                        >
                                            {pencil}
                                        </button>
                                        <button
                                            onClick={deleteEvent}
                                            className=""
                                        >
                                            {trash}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <button 
                onClick={makeEvent}
                className="mx-8 mb-8 text-sm text-white font-regular tracking-wide bg-accent py-2 px-4 rounded-full"
            >
                {makeLabel}
            </button>
        </div>
    )
}
export default EventsEdit