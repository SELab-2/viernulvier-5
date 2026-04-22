/**
 * Event type 
 */
export type Event = {
    key: string
    startDateTime: string
    endDateTime: string
    location: string
    tags: string[]
}

export type EventForm = Omit<Event, 'key'>