import type { Event } from "../../types/event"
import { useLocale } from "./useLocale"

type EventsProps = {
    events: Event[],
    makeEvent: () => void,
    editEvent: (key: string) => void,
    deleteEvent: (key: string) => void
    makeLabel: string
    dateLabel: string,
    timeLabel: string,
    locationLabel: string,
    commentLabel: string,
    actionsLabel: string,
}

const pencilIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
const trashIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>


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
    const locale = useLocale().locale;
    const formatTime = (dateTime?: string) =>{
        return dateTime ? dateTime.slice(11, 16): '';
    };

    return (
        <div className="flex-col">
            <div className="mb-8 mx-8 overflow-hidden">
                <table className=" w-full border-collapse font-muted">
                    <thead className="border-b border-border">
                        <tr>
                            <th className="text-left px-4 py-4 font-bold tracking-wide text-muted">{dateLabel}</th>
                            <th className="text-left px-4 py-4 font-bold tracking-wide text-muted">{timeLabel}</th>
                            <th className="text-left px-4 py-4 font-bold tracking-wide text-muted">{locationLabel}</th>
                            <th className="text-left px-4 py-4 font-bold tracking-wide text-muted">{commentLabel}</th>
                            <th className="text-left px-4 py-4 font-bold tracking-wide text-muted">{actionsLabel}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((event) =>
                            <tr className="h-12 bg-surface" key={event.key}>
                                <td className="px-4 py-4">{ event.starts_at?.split('T')[0] ?? ''}</td>
                                <td className="px-4 py-4">{formatTime(event.starts_at)} - {formatTime(event.ends_at)}</td>
                                <td className="px-4 py-4">{(event.hall_name?.[locale] ?? event.hall_name?.en ?? event.hall_name?.nl ?? '')}</td>
                                <td className="px-4 py-4">
                                {event.info &&
                                    <div className='flex flex-wrap gap-1'>
                                        <span
                                            key={event.info}
                                            className='flex items-center gap-1 rounded-full bg-accent/25 border-accent border px-3 py-1 text-xs font-bold text-foreground'
                                        >
                                            {event.info}
                                        </span>
                                    </div>
                                }
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-12">
                                        <button
                                            onClick={() => editEvent(event.key)}
                                            className=""
                                        >
                                            {pencilIcon}
                                        </button>
                                        <button
                                            onClick={() => deleteEvent(event.key)}
                                            className=""
                                        >
                                            {trashIcon}
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
